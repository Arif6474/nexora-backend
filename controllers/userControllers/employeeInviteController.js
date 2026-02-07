import asyncHandler from 'express-async-handler'
import Employee from '#models/userModels/employeeModel.js'
import EmployeeInvite from '#models/userModels/employeeInviteModel.js'
import { generateToken } from '#utils/helperFunction.js'
import { sendEmployeeInvitationEmail } from '#config/email/emailFormats/sendMail.js'

// invite employee
const inviteEmployee = asyncHandler (async (req,res) => {

    const {email} = req.body

    if(req.employee.level !== 'admin') {
        res.status(400)
        throw new Error('You Must Be An Admin To Add Employees!!')
    }
    
    if(!email){
        res.status(400)
        throw new Error('Please Enter an Email')
    }


    const isExistEmployee = await Employee.findOne({email})

    if (isExistEmployee) {
        res.status(400)
        throw new Error('Employee already exists with this email')
    }

    const emailExistsinInvite = await EmployeeInvite.findOne({email})

    if (emailExistsinInvite) {
        await EmployeeInvite.deleteOne({ email });
    }

    const employeeInvite = await EmployeeInvite.create({
        email,
        employee: req.employee._id
    })

    if (employeeInvite) {
        const token = generateToken(employeeInvite._id)

        //send mail
        const link = process.env.ADMIN_APP_LINK + 'auth/register/' + token
        await sendEmployeeInvitationEmail(employeeInvite.email, link)
        res.status(201).json({
            id: employeeInvite._id,
            email: employeeInvite.email,
            token
        })
        
    } else {
        res.status(400)
        throw new Error('Failed to create employee invite')
    }


})

// get all invites
const getSingleInvite = asyncHandler (async (req,res) => {

    const employeeInvite = await EmployeeInvite.findById(req.params.id)

    res.status(200).json(employeeInvite)
})

// get all invites
const getAllInvites = asyncHandler (async (req,res) => {

     if(req.employee.level !== 'admin' && req.employee.level !== 'superAdmin') {
         res.status(400)
         throw new Error('You must be an admin or super admin to view invites')
     }
     
     const employeeInvites = await EmployeeInvite.find()
 
     res.status(200).json(employeeInvites)
 })
// delete invite
const deleteInvite = asyncHandler (async (req,res) => {

    if(req.employee.level !== 'admin') {
        res.status(400)
        throw new Error('You Must Be An Admin To Delete Invites!!')
    }
    
    const inviteToDelete = await EmployeeInvite.findById(req.params.id)

    if(!inviteToDelete) {
        res.status(400)
        throw new Error('Invite Not Found')
    }

    await EmployeeInvite.deleteOne({ email : inviteToDelete.email});

    res.status(200).json({id: req.params.id})
})


export {
    inviteEmployee,
    getAllInvites,
    getSingleInvite,
    deleteInvite,
}