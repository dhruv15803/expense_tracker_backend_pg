import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";
import { client } from "../index.js";
dotenv.config({
  path: "../.env",
});

const addIncomeCategory = async (req, res) => {
  try {
    const { incomeCategoryName } = req.body;
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
    // check if empty
    if (incomeCategoryName.trim() === "") {
      res.status(400).json({
        success: false,
        message: "please enter a category",
      });
      return;
    }

    // check if category name already exists for logged in user
    const category = await client.query(
      `SELECT * FROM incomeCategories WHERE userid=${
        decodedToken.userid
      } AND categoryname='${incomeCategoryName.trim().toLowerCase()}'`
    );
    if (category.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "category already exists",
      });
      return;
    }
    // insert categoryname into db
    const addCategoryRes = await client.query(
      `INSERT INTO incomeCategories(categoryname,userid) VALUES('${incomeCategoryName
        .trim()
        .toLowerCase()}',${decodedToken.userid}) RETURNING * `
    );
    console.log(addCategoryRes);
    res.status(200).json({
      success: true,
      message: "successfully added category name",
      category: addCategoryRes.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllIncomeCategories = async (req, res) => {
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
      `SELECT * FROM incomecategories WHERE userid=${decodedToken.userid}`
    );
    res.status(200).json({
      success: true,
      categories: categories.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

const addIncome = async (req, res) => {
  try {
    const { incomeTitle, incomeAmount, incomeDate, incomeCategory } = req.body;
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
      incomeTitle.trim() === "" ||
      Number(incomeAmount) === 0 ||
      incomeDate.trim() === "" ||
      incomeCategory.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "please enter all required fields",
      });
      return;
    }

    // getting incomecategoryid for categoryname
    const categoryid = await client.query(
      `SELECT * FROM incomeCategories WHERE userid=${decodedToken.userid} AND categoryname='${incomeCategory}'`
    );

    const newIncome = await client.query(
      `INSERT INTO income(incometitle,incomecategoryid,incomedate,incomeamount,userid) VALUES('${incomeTitle}',${
        categoryid.rows[0].incomecategoryid
      },'${incomeDate}',${Number(incomeAmount)},${
        decodedToken.userid
      }) RETURNING *`
    );

    res.status(200).json({
      success: true,
      message: "successfully added income",
      income: newIncome.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const editIncome = async (req, res) => {
  try {
    const {
      newIncomeTitle,
      newIncomeAmount,
      newIncomeCategory,
      newIncomeDate,
      incomeid,
    } = req.body;
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
    if (
      newIncomeTitle.trim() === "" ||
      Number(newIncomeAmount) === 0 ||
      newIncomeDate.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "please enter all required fields",
      });
      return;
    }

    // get categoryid from newIncomeCategory
    const category = await client.query(
      `SELECT * FROM incomeCategories WHERE userid=${decodedToken.userid} AND categoryname='${newIncomeCategory}'`
    );
    const categoryid = category.rows[0].incomecategoryid;
    console.log(categoryid);
    // UPDATE QUERY
    await client.query(
      `UPDATE income SET incometitle='${newIncomeTitle}',incomecategoryid=${categoryid},incomedate='${newIncomeDate}',incomeamount=${Number(
        newIncomeAmount
      )} WHERE userid=${decodedToken.userid} AND incomeid=${incomeid}`
    );

    // getting updated income
    const updatedIncome = await client.query(
      `SELECT * FROM income WHERE incomeid=${incomeid} AND userid=${decodedToken.userid}`
    );

    res.status(200).json({
      success: true,
      message: "successfully edited income",
      newIncome: updatedIncome.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { incomeid } = req.body;
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
    //   deletion query
    await client.query(
      `DELETE FROM income WHERE userid=${decodedToken.userid} AND incomeid=${incomeid}`
    );
    res.status(200).json({
      success: true,
      message: "successfully deleted income",
    });
  } catch (error) {
    console.log(error);
  }
};

const getIncomeCategoryNameById = async (req, res) => {
  try {
    const { categoryid } = req.body;
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
    const categoryNameRes = await client.query(
      `SELECT * FROM income INNER JOIN incomeCategories ON income.incomecategoryid=incomeCategories.incomecategoryid WHERE income.userid=${
        decodedToken.userid
      } AND income.incomecategoryid=${Number(categoryid)}`
    );
    res.status(200).json({
      success: true,
      categoryname: categoryNameRes.rows[0].categoryname,
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllIncomes = async (req, res) => {
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
    const incomes = await client.query(
      `SELECT * FROM income WHERE userid=${decodedToken.userid}`
    );
    res.status(200).json({
      success: true,
      incomes: incomes.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

export {
  addIncomeCategory,
  getAllIncomeCategories,
  addIncome,
  getAllIncomes,
  getIncomeCategoryNameById,
  editIncome,
  deleteIncome,
};
