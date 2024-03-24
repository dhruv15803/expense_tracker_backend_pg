import { client } from "../index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({
  path: "../.env",
});

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dqcptinzd",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const registerUser = async (req, res) => {
  try {
    console.log(req.body);
    const { username, email, password } = req.body;
    if (
      username.trim() === "" ||
      email.trim() === "" ||
      password.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "Please enter the required fields to register",
      });
      return;
    }

    if (req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is already logged in",
      });
      return;
    }

    // check if a user with same username or email does not exist
    const response = await client.query(
      `SELECT * FROM users WHERE username='${username.toLowerCase()}' OR email='${email.toLowerCase()}'`
    );
    if (response.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "user already exists",
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // getting avatar url
    let cloudinary_response;
    if (req.file?.path) {
      cloudinary_response = await cloudinary.uploader.upload(req.file?.path, {
        resource_type: "auto",
      });
    }

    // inserting into database
    if (req.file?.path) {
      await client.query(
        `INSERT INTO users(username,email,password,useravatar) VALUES('${username.toLowerCase()}','${email.toLowerCase()}','${hashedPassword}','${
          cloudinary_response.url
        }')`
      );
    } else {
      await client.query(
        `INSERT INTO users(username,email,password) VALUES('${username.toLowerCase()}','${email.toLowerCase()}','${hashedPassword}')`
      );
    }
    // checking if the insert query worked
    const user = await client.query(
      `SELECT * FROM users WHERE username='${username.toLowerCase()}'`
    );
    if (user.rows.length === 0) {
      res.status(500).json({
        success: false,
        message: "something went wrong with DB",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "user successfully registered",
    });
  } catch (error) {
    console.log(error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.trim() === "" || password.trim() === "") {
      res.status(400).json({
        success: false,
        message: "please enter all required fields",
      });
      return;
    }

    if (req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is already logged in",
      });
      return;
    }

    // checking if email and password are correct

    const user = await client.query(
      `SELECT * FROM users WHERE email='${email.toLowerCase()}'`
    );
    const isCorrect = await bcrypt.compare(password, user.rows[0].password);
    if (user.rows.length === 0 || !isCorrect) {
      res.status(400).json({
        success: false,
        message: "incorrect email or password",
      });
      return;
    }
    // correct
    // sending cookies
    const token = jwt.sign(user.rows[0], process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("accessToken", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 72 * 3600000)
      })
      .json({
        success: true,
        message: "successfully logged in",
        user: user.rows[0],
      });
  } catch (error) {
    console.log(error);
  }
};

const getLoggedInUser = async (req, res) => {
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
    console.log(decodedToken);
    const user = await client.query(
      `SELECT * FROM users WHERE userId=${Number(decodedToken.userid)}`
    );
    if (user.rows.length === 0) {
      res.status(500).json({
        success: false,
        message: "user not found in db",
      });
      return;
    }
    res.status(200).json({
      success: true,
      user: user.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const logoutUser = async (req, res) => {
  // need to be logged in to logout
  try {
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }
    res.status(200).clearCookie("accessToken").json({
      success: true,
      message: "successfully logged out",
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await client.query(`SELECT * FROM users`);
    res.status(200).json({
      success: true,
      users: users.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

export { registerUser, getAllUsers, loginUser, getLoggedInUser, logoutUser };
