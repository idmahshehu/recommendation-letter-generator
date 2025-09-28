'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Model } = require('sequelize');
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [referee, applicant]
 *         fullname:
 *           type: string
 *         institution:
 *           type: string
 *         department:
 *           type: string
 *         title:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         university_logo_url:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isEmailVerified:
 *           type: boolean
 *         resetPasswordToken:
 *           type: string
 *         resetPasswordExpires:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
module.exports = (sequelize, DataTypes) => {
  class User extends Model {

    static associate(models) {
      // User has many Templates (creator)
      this.hasMany(models.Template, { foreignKey: 'created_by', as: 'createdTemplates' });

      // User has many Letters (referee)
      this.hasMany(models.Letter, { foreignKey: 'referee_id', as: 'refereeLetters' });
    }

    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to generate JWT token
    generateAuthToken() {
      return jwt.sign(
        {
          id: this.id,
          email: this.email,
          role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
    }

    // Method to get user without password
    toJSON() {
      const user = { ...this.get() };
      delete user.password;
      delete user.resetPasswordToken;
      delete user.resetPasswordExpires;
      return user;
    }
  }

  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('referee', 'applicant'),
      allowNull: false,
      defaultValue: 'applicant'
    },
    // Profile fields added below
    fullname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    institution: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    university_logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // Hash password before saving
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
};