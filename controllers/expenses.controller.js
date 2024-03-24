import { client } from "../index.js";
import jwt from "jsonwebtoken";

const addExpenseCategory = async (req, res) => {
  try {
    const { expenseCategoryName } = req.body;
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    if (expenseCategoryName.trim() === "") {
      res.status(400).json({
        success: false,
        message: "expense category cannot be empty",
      });
      return;
    }
    // checking if a user has no duplicating expense categories
    const category = await client.query(
      `SELECT * FROM expenseCategories WHERE categoryname='${expenseCategoryName
        .trim()
        .toLowerCase()}' AND userid='${decodedToken.userid}'`
    );
    if (category.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "This category already exists",
      });
      return;
    }
    // inserting category in database
    const addCategoryRes = await client.query(
      `INSERT INTO expenseCategories(categoryname,userid) VALUES('${expenseCategoryName.toLowerCase()}','${
        decodedToken.userid
      }') RETURNING *`
    );
    console.log(addCategoryRes);

    res.status(201).json({
      success: true,
      message: "successfully added expense category",
      expenseCategory: addCategoryRes.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const addExpense = async (req, res) => {
  try {
    const { expenseTitle, expenseCategory, expenseAmount, expenseDate } =
      req.body;
    console.log(expenseDate);
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    if (
      expenseTitle.trim() === "" ||
      expenseCategory.trim() === "" ||
      Number(expenseAmount) === 0 ||
      expenseDate.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "please enter all required fields",
      });
      return;
    }
    // getting expensecategoryid from expenseCategory
    const category = await client.query(
      `SELECT * FROM expenseCategories WHERE userid='${decodedToken.userid}' AND categoryname='${expenseCategory}'`
    );
    const expensecategoryid = category.rows[0].expensecategoryid;

    // inserting expense
    const addExpenseRes = await client.query(
      `INSERT INTO expenses(expensetitle,expensecategoryid,expensedate,expenseamount,userid) VALUES('${expenseTitle}','${expensecategoryid}','${expenseDate}','${expenseAmount}','${decodedToken.userid}') RETURNING*`
    );
    
    res.status(201).json({
      success: true,
      message: "successfully added expense",
      expense: addExpenseRes.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const getExpenseCategoryNameById = async (req, res) => {
  try {
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    const { categoryid } = req.body;
    const categoryname = await client.query(
      `SELECT DISTINCT categoryname FROM expenses INNER JOIN expenseCategories ON expenses.expensecategoryid = expenseCategories.expensecategoryid WHERE expenses.expensecategoryid=${categoryid} AND expenses.userid=${decodedToken.userid};`
    );
    console.log(categoryname);
    res.status(200).json({
      success: true,
      categoryname: categoryname.rows[0].categoryname,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { expenseid } = req.body;
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    const deleteExpenseRes = await client.query(
      `DELETE FROM expenses WHERE userid=${decodedToken.userid} AND expenseid=${expenseid}`
    );
    console.log(deleteExpenseRes);
    res.status(200).json({
      success: true,
      message: "successfully deleted expense",
    });
  } catch (error) {
    console.log(error);
  }
};


const editExpense = async (req,res) => {
try {
        const {expenseid,newExpenseTitle,newExpenseAmount,newExpenseCategory,newExpenseDate} = req.body;
        console.log(req.body);
        if (!req.cookies?.accessToken) {
            res.status(400).json({
              success: false,
              message: "user is not logged in",
            });
            return;
          }
          const decodedToken = jwt.verify(
            req.cookies.accessToken,
            process.env.JWT_SECRET
          );
          if (!decodedToken) {
            res.status(500).json({
              success: false,
              message: "something went wrong with jwt",
            });
            return;
          }
        //   getting  category if for new category name
        const category = await client.query(
            `SELECT * FROM expenseCategories WHERE userid='${decodedToken.userid}' AND categoryname='${newExpenseCategory}'`
          );
          console.log(category);
        const newExpensecategoryid = category.rows[0].expensecategoryid;
    
        // updating expense
         await client.query(`UPDATE expenses SET expensetitle='${newExpenseTitle}',expensecategoryid='${newExpensecategoryid}',expensedate='${newExpenseDate}',expenseamount=${newExpenseAmount} WHERE expenseid=${expenseid} AND userid=${decodedToken.userid}`)

        const updatedExpense = await client.query(`SELECT * FROM expenses WHERE expenseid=${expenseid} AND userid=${decodedToken.userid}`)

        res.status(200).json({
            "success":true,
            "message":"successfully edited expense",
            "updatedExpense":updatedExpense.rows[0],
        })
} catch (error) {
    console.log(error);
}

}



const getAllExpenses = async (req, res) => {
  try {
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    const expenses = await client.query(
      `SELECT * FROM expenses WHERE userid='${decodedToken.userid}'`
    );
    res.status(200).json({
      success: true,
      expenses: expenses.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllExpenseCategories = async (req, res) => {
  try {
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    const decodedToken = jwt.verify(
      req.cookies.accessToken,
      process.env.JWT_SECRET
    );
    if (!decodedToken) {
      res.status(500).json({
        success: false,
        message: "something went wrong with jwt",
      });
      return;
    }
    const categories = await client.query(
      `SELECT * FROM expenseCategories WHERE userid = '${decodedToken.userid}'`
    );
    res.status(200).json({
      success: true,
      categories: categories.rows,
    });
  } catch (error) {
    console.log(error);
  }
};




export {
  addExpenseCategory,
  getAllExpenseCategories,
  addExpense,
  getAllExpenses,
  getExpenseCategoryNameById,
  deleteExpense,
  editExpense,
};
