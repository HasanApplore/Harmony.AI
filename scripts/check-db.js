#!/usr/bin/env node

/**
 * Database Connection Checker
 * 
 * This script checks if the database connection is working properly.
 * It helps diagnose issues with the DATABASE_URL environment variable.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking database connection...');

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.log('Please make sure you have a .env file with DATABASE_URL defined.');
  process.exit(1);
}

console.log(`✅ DATABASE_URL is defined: ${maskConnectionString(process.env.DATABASE_URL)}`);

// Try to connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to the database!');
    
    // Run a simple query to verify connection is working
    return client.query('SELECT NOW() as current_time')
      .then(res => {
        console.log(`✅ Database query successful. Current database time: ${res.rows[0].current_time}`);
        client.release();
        pool.end();
      });
  })
  .catch(err => {
    console.error('❌ Failed to connect to the database!');
    console.error(`Error details: ${err.message}`);
    
    // Provide helpful suggestions based on the error
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\nPossible solutions:');
      console.log('1. Check if your PostgreSQL server is running');
      console.log('2. Verify the host and port in your DATABASE_URL are correct');
      console.log('3. If using a cloud database, check if your IP is allowed in the firewall settings');
    } else if (err.message.includes('password authentication failed')) {
      console.log('\nPossible solutions:');
      console.log('1. Check if the username and password in your DATABASE_URL are correct');
      console.log('2. Verify that the user has the necessary permissions');
    } else if (err.message.includes('database') && err.message.includes('does not exist')) {
      console.log('\nPossible solutions:');
      console.log('1. Create the database using: CREATE DATABASE your_database_name;');
      console.log('2. Check if the database name in your DATABASE_URL is correct');
    } else if (err.message.includes('ssl')) {
      console.log('\nPossible solutions:');
      console.log('1. If using a cloud database, make sure to include ?sslmode=require in your connection string');
      console.log('2. For local development, you might need to disable SSL by removing ?sslmode=require');
    }
    
    console.log('\nFor cloud-based PostgreSQL (like Neon):');
    console.log('1. Make sure you have copied the correct connection string from your provider');
    console.log('2. Check if your database is active and not in a paused state');
    console.log('3. Verify that your connection string includes the correct database name');
    
    pool.end();
    process.exit(1);
  });

// Helper function to mask sensitive information in connection string
function maskConnectionString(connectionString) {
  try {
    // Parse the connection string
    const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/;
    const match = connectionString.match(regex);
    
    if (match) {
      const [, username, password, host, dbAndParams] = match;
      // Mask the password
      return `postgres://${username}:****@${host}/${dbAndParams}`;
    }
    
    // If regex doesn't match, return a masked version
    return connectionString.replace(/:[^@:]+@/, ':****@');
  } catch (error) {
    // If any error occurs during masking, return a generic masked string
    return '****masked****';
  }
}