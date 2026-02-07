import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import asyncHandler from 'express-async-handler'
import Modarator from "#models/userModels/modaratorModel.js"
import { generateToken } from '#utils/helperFunction.js'
import { sendForgotPasswordMail, sendModeratorInvitationEmail } from '#config/email/emailFormats/sendMail.js'


const { genSalt, hash, compare } = bcrypt
const { verify } = jwt

const getAllModarators = asyncHandler(async (req, res) => {
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
        query.isRegistered = true
    }else if (filter === 'Archived') {
        query.isActive = false
    }else if (filter === 'Invited') {
        query.isRegistered = false
    }
    const modarators = await Modarator.find(query)
    res.status(200).json(modarators)
})


const loginModarator = asyncHandler(async (req, res) => {

    const { email, password } = req.body

    const modarator = await Modarator.findOne({ email })

    if (!modarator) {
        res.status(400)
        throw new Error('No modarator found with this email')
    }

    if (modarator && (await compare(password, modarator.password))) {
        res.status(200).json({
            _id: modarator.id,
            name: modarator.name,
            email: modarator.email,
            level: modarator.level,
            image: modarator.image,
            isRegistered: modarator.isRegistered,
            token: generateToken(modarator._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid Credentials')
    }

})

const registerModarator = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body


    const isExistModarator = await Modarator.findOne({ email })

    if (!isExistModarator) {
        res.status(400)
        throw new Error('Modarator is not found with this email')
    }

    const salt = await genSalt(10)
    const hashedPassword = await hash(password, salt)

    const updatedModarator = await Modarator.findByIdAndUpdate(isExistModarator._id, {
        name,
        password: hashedPassword,
        isRegistered: true
    },
        { new: true }
    )


    if (updatedModarator && (await compare(password, updatedModarator.password))) {
        res.status(200).json({
            _id: updatedModarator.id,
            name: updatedModarator.name,
            email: updatedModarator.email,
            level: updatedModarator.level,
            image: updatedModarator.image,
            isRegistered: updatedModarator.isRegistered,
            token: generateToken(updatedModarator._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid Modarator Data');
    }
})

const inviteModerator = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const existingModerator = await Modarator.findOne({ email });

    if (existingModerator) {
        res.status(400);
        throw new Error('Moderator with this email already exists.');
    }

    const newModerator = await Modarator.create({
        name,
        email,
    });

    if (newModerator) {
        const token = generateToken(newModerator._id)

        //send mail
        const link = process.env.MODARATOR_APP_LINK + 'sign-up/?token=' + token
        await sendModeratorInvitationEmail(newModerator.email, link)
        res.status(201).json({
            id: newModerator._id,
            email: newModerator.email,
            token
        })

    } else {
        res.status(400)
        throw new Error('Failed to create Modarator invite')
    }

});


const changeModaratorPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body;
    const { _id, email } = req.modarator

    if (!oldPassword || !newPassword) {
        res.status(400)
        throw new Error('Please add all fields')
    }

    const modarator = await Modarator.findOne({ email })

    if (!modarator) {
        res.status(400)
        throw new Error('No Modarator found with this email!!')
    }

    const checkPassword = await compare(oldPassword, modarator.password)

    if (!checkPassword) {
        res.status(400)
        throw new Error('Old Password does not match')
    }

    // Hash Password
    const salt = await genSalt(10)
    const hashedPassword = await hash(newPassword, salt)

    const updateData = {
        password: hashedPassword
    }

    const updatedData = await Modarator.findByIdAndUpdate(_id, updateData)

    res.status(200).json(updatedData)


})

const forgotModaratorPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error('Please add an email')
    }

    const isExistModarator = await Modarator.findOne({ email });

    if (!isExistModarator) {
        res.status(400)
        throw new Error('No Modarator found with this email!!')
    }

    const token = generateToken(isExistModarator._id)

    const link = process.env.MODARATOR_APP_LINK + 'recover-password?token=' + token

    const sendMail = await sendForgotPasswordMail(isExistModarator.email, link)

    res.status(201).json({
        id: isExistModarator._id,
        email: isExistModarator.email,
        sendMail
    })

})

const resetModaratorPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!newPassword) {
        res.status(400)
        throw new Error('Please add new Password')
    }

    const decoded = verify(token, process.env.JWT_SECRET)

    const modaratorFromToken = await Modarator.findById(decoded.id)

    if (!modaratorFromToken) {
        res.status(400)
        throw new Error('Could not generate modarator from token')
    }

    const salt = await genSalt(10)
    const hashedPassword = await hash(newPassword, salt)

    const updateData = {
        password: hashedPassword
    }

    const updatedData = await Modarator.findByIdAndUpdate(modaratorFromToken._id, updateData, { new: true })

    res.status(200).json(updatedData)


})

const getEmailFromToken = asyncHandler(async (req, res) => {
    const { token } = req.params

    const decoded = verify(token, process.env.JWT_SECRET);

    const invite = await Modarator.findById(decoded.id);

    if (invite) {

        const { email, name } = invite

        res.status(201).json({
            email,
            name
        })

    } else {
        res.status(400)
        throw new Error('No Email Found with Token!!')
    }

})

const archiveModarator = asyncHandler(async (req, res) => {
    const { id } = req.params
     const moderator = await Modarator.findById(id)
    if (!moderator) {
        res.status(400)
        throw new Error('No moderator found')
    }

    const updatedData = await Modarator.findByIdAndUpdate(id, req.body, { new: true })
    res.status(200).json(updatedData)
})

const getSingleModerator = asyncHandler(async (req, res) => {
    const { id } = req.params
    const moderator = await Modarator.findById(id)
    if (!moderator) {
        res.status(400)
        throw new Error('No moderator found')
    }
    res.status(200).json(moderator)
})

const resendModeratorInvitation = asyncHandler(async (req, res) => {
    const { id } = req.params
    const moderator = await Modarator.findById(id)
    if (!moderator) {
        res.status(400)
        throw new Error('No moderator found')
    }

    const token = generateToken(moderator._id)

    const link = process.env.MODARATOR_APP_LINK + 'sign-up/?token=' + token
    await sendModeratorInvitationEmail(moderator.email, link)
    res.status(201).json({
        id: moderator._id,
        email: moderator.email,
        token
    })
})
export {
    getAllModarators,
    loginModarator,
    registerModarator,
    inviteModerator,
    changeModaratorPassword,
    forgotModaratorPassword,
    resetModaratorPassword,
    getEmailFromToken,
    archiveModarator,
    getSingleModerator,
    resendModeratorInvitation

}