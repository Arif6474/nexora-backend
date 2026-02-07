import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import asyncHandler from 'express-async-handler'
import Employee from "#models/userModels/employeeModel.js"
import { generateToken } from '#utils/helperFunction.js'
import EmployeeInvite from '#models/userModels/employeeInviteModel.js'
import { sendForgotPasswordMail } from '#config/email/emailFormats/sendMail.js'
import { getDocumentsWithQuery } from '#crudServices/crudServices.js'

const { genSalt, hash, compare } = bcrypt
const { verify } = jwt

const getAllEmployeesWithQuery = asyncHandler(async (req, res) => {
   
    await getDocumentsWithQuery({ model: Employee, req, res });
})

// Login Employee
const loginEmployee = asyncHandler (async (req,res) => {

    const {email, password} = req.body
    const employee = await Employee.findOne({email})

    if(!employee) {
        res.status(400)
        throw new Error('No employee found with this email')
    }

    // Check if password matches
    if (employee && (await compare(password, employee.password))) {
        res.status(200).json({
            _id: employee.id,
            name: employee.name,
            email: employee.email,
            level: employee.level,
            image: employee.image,
            isRegistered: employee.isRegistered,
            token: generateToken(employee._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid Credentials')
    }

})

// Register Employee
const registerEmployee = asyncHandler (async (req,res) => {
    const {name, email, password} = req.body
    
    // if(!req.file) {
    //     res.status(400)
    //     throw new Error('Please add an image')
    // }

    //Employee Email Present Or Not
    const isExistEmployee = await Employee.findOne({email})

    if (isExistEmployee) {
        res.status(400)
        throw new Error('Employee already exists with this email')
    }

    const employeeInvitation =await EmployeeInvite.findOne({email});
    if(!employeeInvitation){
        res.status(400)
        throw new Error('Employee invitation not found')
    }

    // Hash Password
    const salt = await genSalt(10)
    const hashedPassword = await hash(password, salt)

    const employee = await Employee.create({
        name,
        email,
        level:'employee',
        password: hashedPassword,
        // image: req.file.path
    })


    if (employee) {
        await EmployeeInvite.deleteOne({ email });
    
        return res.status(201).json({
          _id: employee.id,
          name: employee.name,
          email: employee.email,
          level: employee.level,
          // dp: employee.dp,
          token: generateToken(employee._id),
        });
      } else {
        return res.status(400).json({ error: 'Invalid Employee Data' });
      }
})

// Change Employee Password
const changeEmployeePassword = asyncHandler (async (req,res) => {

    const { oldPassword, newPassword } = req.body;
    const {_id, email} = req.employee

    if(!oldPassword || !newPassword) {
        res.status(400)
        throw new Error('Please add all fields')
    }

    // Check for employee email
    const employee = await Employee.findOne({email})

    if(!employee) {
        res.status(400)
        throw new Error('No employee found with this email!!')
    }

    const checkPassword = await compare(oldPassword, employee.password)
    
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

    const updatedData = await Employee.findByIdAndUpdate(_id, updateData)

    res.status(200).json(updatedData)


})

// Forgot Employee Password
const forgotEmployeePassword = asyncHandler (async (req,res) => {
    const {email} = req.body

    if (!email) {
        res.status(400)
        throw new Error('Please add an email')
    }
    
    //Employee Present Or Not
    const isExistEmployee = await Employee.findOne({email});

    if(!isExistEmployee){
        res.status(400)
        throw new Error('No employee found with this email!!')
    }

    const token = generateToken(isExistEmployee._id)

    //send mail
    const link = process.env.ADMIN_APP_LINK + 'auth/resetEmployeePassword/' + token

    const sendMail = await sendForgotPasswordMail(isExistEmployee.email, link)

    res.status(201).json({
        id: isExistEmployee._id,
        email: isExistEmployee.email,
        sendMail
    })

})

//Reset Employee Password
const resetEmployeePassword = asyncHandler (async (req,res) => {
    const { token, newPassword } = req.body;

    if (!newPassword) {
        res.status(400)
        throw new Error('Please add new Password')
    }

    const decoded = verify(token, process.env.JWT_SECRET)

    const employeeFromToken = await Employee.findById(decoded.id)

    if (!employeeFromToken) {
        res.status(400)
        throw new Error('Could not generate employee from token')
    }

    // Hash Password
    const salt = await genSalt(10)
    const hashedPassword = await hash(newPassword, salt)

    const updateData = {
        password: hashedPassword
    }

    const updatedData = await Employee.findByIdAndUpdate(employeeFromToken._id, updateData)

    res.status(200).json(updatedData)


})

// get email from token
const getEmailFromToken = asyncHandler (async (req,res) => {
    const { token } = req.params

    const decoded = verify(token, process.env.JWT_SECRET);

    const invite = await EmployeeInvite.findOne({_id: decoded.id});

    if(invite) {

        const {email} = invite

        res.status(201).json({
            email
        })

    } else {
        res.status(400)
        throw new Error('No Email Found with Token!!')
    }

})
export {
    getAllEmployeesWithQuery,
    loginEmployee,
    registerEmployee,
    changeEmployeePassword, 
    forgotEmployeePassword,
    resetEmployeePassword,
    getEmailFromToken

}