import { updateFile } from "#utils/updateFile.js";
import { uploadFile } from "#utils/uploadFile.js";
import { deleteFile } from "#utils/deleteFile.js";

const getAllDocuments = async ({ model, req, res, sortBy }) => {
    const { search, filter } = req.query
    const query = {}
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ]
    }
    if (filter === 'Active') {
        query.isActive = true
    } else if (filter === 'Archived') {
        query.isActive = false
    } else if (filter === 'Verified') {
        query.isVerified = true

    } else if (filter === 'Unverified') {
        query.isVerified = false
    }
    try {
        const schemaPaths = model.schema.paths;
        const refs = Object.keys(schemaPaths)
            .filter((key) => schemaPaths[key].instance === 'ObjectID' && schemaPaths[key].options.ref)
            .map((key) => schemaPaths[key].options.path);

        const documents = await model.find(query).populate(refs).sort(sortBy);;

        res.status(200).json(documents);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const getSingleDocument = async ({ model, req, res }) => {
    try {
        const { id } = req.params;

        const schemaPaths = model.schema.paths;
        const refs = Object.keys(schemaPaths)
            .filter((key) => schemaPaths[key].instance === 'ObjectId' && schemaPaths[key].options.ref)
            .map((key) => schemaPaths[key].path);

        const document = await model.findById(id).populate(refs);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.status(200).json(document);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const createDocument = async ({ model, req, res, folderName, createdBy }) => {
    const uploadedFiles = [];
    try {
        const newDocumentData = { ...req.body };

        if (req.files) {
            for (const [key, files] of Object.entries(req.files)) {
                for (const file of Array.isArray(files) ? files : [files]) {
                    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
                    const filePath = `${folderName}/${fileName}`;

                    await uploadFile(file.mimetype, filePath, file.buffer);
                    uploadedFiles.push(filePath);

                    newDocumentData[key] = `${filePath}`;
                }
            }
        }

        if (createdBy) {
            newDocumentData.createdBy = createdBy;
        }

        const newDocument = await model.create(newDocumentData);
        res.status(201).json(newDocument);
    } catch (error) {
        for (const filePath of uploadedFiles) {
            try {
                await deleteFile(filePath);
            } catch (err) {
                console.error(`Failed to clean up file ${filePath}:`.red, err);
            }
        }
        res.status(400).json({ error: error.message });
    }
};


const updateDocument = async ({ model, req, res, folderName }) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        const document = await model.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (req.files) {
            for (const [key, files] of Object.entries(req.files)) {
                for (const file of Array.isArray(files) ? files : [files]) {
                    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
                    const filePath = `${folderName}/${fileName}`;

                    const newFileUrl = await updateFile(
                        filePath,
                        file.buffer,
                        document[key],
                        file.mimetype
                    );

                    updateData[key] = newFileUrl;
                }
            }
        }

        await model.findByIdAndUpdate(id, updateData, { new: true });

        const updatedDocument = await model.findById(id);
        res.status(200).json(updatedDocument);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteDocument = async ({ model, req, res, fileFields = [] }) => {
    try {
        const { id } = req.params;
        const document = await model.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        fileFields.forEach(async field => {
            if (document[field]) {
                await deleteFile(document[field])
            }
        })

        const deletedDocument = await model.findByIdAndDelete(id);

        res.status(200).json(deletedDocument);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const archiveDocument = async ({ model, req, res }) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const document = await model.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        await model.findByIdAndUpdate(id, { isActive });

        const updatedDocument = await model.findById(id);

        res.status(200).json(updatedDocument);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getDocumentsWithQuery = async ({ model, req, res, filters }) => {
    try {
        const page = parseInt(req.query.currentPage) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchQuery = req.query.search || '';
        const filter = req.query.filter || '';
        // const filters = req.query.filters ? JSON.parse(req.query.filters) : {}


        const searchCondition = {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { title: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { orderId: { $regex: searchQuery, $options: 'i' } },
                { phone: { $regex: searchQuery, $options: 'i' } },
                { questionText: { $regex: searchQuery, $options: 'i' } },
                { isLinkOrImage: { $regex: searchQuery, $options: 'i' } },
                { size: { $regex: searchQuery, $options: 'i' } },
                { 'itemSize.size': { $regex: searchQuery, $options: 'i' } },
                { 'item.title': { $regex: searchQuery, $options: 'i' } },

                // { category: { $regex: searchQuery, $options: 'i' } },
            ]
        };

        // Explicitly handle category filter from query params
        if (req.query.category) {
            searchCondition.category = req.query.category;
        }

        if (filter === 'Active') {
            searchCondition.isActive = true
        } else if (filter === 'Archived') {
            searchCondition.isActive = false
        }
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    searchCondition[key] = filters[key];
                }
            });
        }

        const schemaPaths = model.schema.paths;
        const refs = Object.keys(schemaPaths)
            .filter((key) => schemaPaths[key].instance === 'ObjectId' && schemaPaths[key].options.ref)
            .map((key) => schemaPaths[key].path);

        const documents = await model.find(searchCondition).populate(refs)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const totalCount = await model.countDocuments(searchCondition);

        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            totalItems: totalCount,
            totalPages,
            currentPage: page,
            pageSize: limit,
            documents
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// const getDocumentsWithQuery = async ({ model, req, res }) => {
//     try {
//         const page = parseInt(req.query.currentPage) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const searchQuery = req.query.search || '';
//         const filters = req.query.filters ? JSON.parse(req.query.filters) : {}

//         const searchCondition = {
//             $or: [
//                 { name: { $regex: searchQuery, $options: 'i' } },
//                 { title: { $regex: searchQuery, $options: 'i' } },
//                 { email: { $regex: searchQuery, $options: 'i' } },
//                 { description: { $regex: searchQuery, $options: 'i' } },
//                 { orderId: { $regex: searchQuery, $options: 'i' } },
//                 { phone: { $regex: searchQuery, $options: 'i' } },
//                 { questionText: { $regex: searchQuery, $options: 'i' } },
//                 { isLinkOrImage: { $regex: searchQuery, $options: 'i' } },
//                 { size: { $regex: searchQuery, $options: 'i' } },
//                 { 'itemSize.size': { $regex: searchQuery, $options: 'i' } },

//                 // { category: { $regex: searchQuery, $options: 'i' } },
//             ]
//         };

//         Object.keys(filters).forEach(key => {
//             if (filters[key]) {
//                 searchCondition[key] = filters[key];
//             }
//         });

//         const schemaPaths = model.schema.paths;
//         const refs = Object.keys(schemaPaths)
//             .filter((key) => schemaPaths[key].instance === 'ObjectId' && schemaPaths[key].options.ref)
//             .map((key) => schemaPaths[key].path);

//         const documents = await model.find(searchCondition).populate(refs)
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .exec();

//         const totalCount = await model.countDocuments(searchCondition);

//         const totalPages = Math.ceil(totalCount / limit);

//         res.status(200).json({
//             totalItems: totalCount,
//             totalPages,
//             currentPage: page,
//             pageSize: limit,
//             documents
//         });
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };



export {
    getAllDocuments,
    getSingleDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    getDocumentsWithQuery
};




// const createDocument = async ({ model, req, res, folderName, createdBy }) => {
//     try {
//         const newDocumentData = { ...req.body };

//         if (req.files) {
//             for (const [key, file] of Object.entries(req.files)) {
//                 const fileName = `${Date.now()}-${file.name}`;
//                 const filePath = `${folderName}/${fileName}`;

//                 await uploadFile(file.mimetype, filePath, file.data);

//                 newDocumentData[key] = filePath;
//             }
//         }
//         if (createdBy) {
//             newDocumentData.createdBy = createdBy;
//         }

//         const newDocument = await model.create(newDocumentData);
//         res.status(201).json(newDocument);

//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };