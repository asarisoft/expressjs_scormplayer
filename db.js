const { Sequelize } = require('sequelize');

// Connect to the PostgreSQL database using Sequelize
const sequelize = new Sequelize('postgres://imam:asari1@localhost:5432/scorm_player1');

// Define the Todo model
const ScormHistory = sequelize.define('ScormHistory', {
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  scorm_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  history: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  completed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

const ScormContent = sequelize.define('ScormContent', {
  scorm_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  url: {
    type: Sequelize.STRING,
    allowNull: true
  },
});

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Database synced');
  })
  .catch((err) => {
    console.error('Error syncing database', err);
  });

module.exports = { sequelize, ScormHistory, ScormContent };