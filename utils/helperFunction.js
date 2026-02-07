import jwt from 'jsonwebtoken'
const { sign } = jwt

// Generate Token
export function generateToken(id) {
    return sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '2d'
    })
}