import mongoose from 'mongoose';

/**
 * Utility function to wrap database operations in a MongoDB transaction
 * @param {Function} operation - The async function containing transactional operations
 * @param {Object} options - Optional configuration options
 * @returns {Promise<*>} - The result of the transactional operation
 */
const withTransaction = async (operation, options = {}) => {
  // Start a session for the transaction
  const session = await mongoose.startSession();

  try {
    // Start the transaction
    session.startTransaction(options);

    // Execute the transactional operation with the session
    const result = await operation(session);

    // Commit the transaction if everything succeeded
    await session.commitTransaction();

    return result;
  } catch (error) {
    // Abort the transaction if any error occurs
    await session.abortTransaction();

    // Re-throw the error to be handled by the caller
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

export default withTransaction;
