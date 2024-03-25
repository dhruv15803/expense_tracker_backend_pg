import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import pkg from 'pg';
import multer from 'multer';
import { getAllUsers, getLoggedInUser, loginUser, logoutUser, registerUser } from './controllers/user.controller.js';
import { addExpense, addExpenseCategory, deleteExpense, editExpense, getAllExpenseCategories, getAllExpenses, getAllSortedExpenses, getExpenseCategoryNameById } from './controllers/expenses.controller.js';
const {Client} = pkg;
dotenv.config({
    path:"./.env"
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './Public');
    },
    filename: function (req, file, cb) {
      cb(null,file.originalname);
    }
  })

  const upload = multer({storage:storage})

export const client = new Client({
    host:process.env.DB_HOST,
    database:"expense_tracker_db",
    user:"postgres",
    port:process.env.DB_PORT,
    password:process.env.DB_PASSWORD,
})

const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))

const connectToDb = async ()=>{
try {
    await client.connect();
} catch (error) {
    console.log('DB CONNECTION ERROR',error);
}
}

connectToDb();

// user routes
app.post('/user/register',upload.single('avatar'),registerUser);
app.get('/user/getAllUsers',getAllUsers);
app.post('/user/login',loginUser);
app.get('/user/getLoggedInUser',getLoggedInUser);
app.get('/user/logout',logoutUser);

// expense routes
app.post('/expense/addCategory',addExpenseCategory);
app.get('/expense/getAllExpenseCategories',getAllExpenseCategories);
app.post('/expense/add',addExpense);
app.get('/expense/getAllExpenses',getAllExpenses);
app.post('/expense/getExpenseCategoryNameById',getExpenseCategoryNameById);
app.post('/expense/delete',deleteExpense);
app.post('/expense/edit',editExpense);
app.post('/expense/getAllSortedExpenses',getAllSortedExpenses);

app.listen(port,()=>{
    console.log(`server running at http://localhost:${port}`);
})