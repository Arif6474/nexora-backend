import mongoose from 'mongoose';

const {connect} = mongoose;

async function connectDB() {
    try {
        const conn = await connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline)
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;