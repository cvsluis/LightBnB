const db = require('./index');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryParams = [email];
  const queryString = `SELECT * FROM users WHERE email = $1;`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows) {
        return result.rows[0];
      }
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryParams = [id];
  const queryString = `SELECT * FROM users WHERE id = $1;`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows) {
        return result.rows[0];
      }
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const queryParams = [user.name, user.email, user.password];
  const queryString = `
  INSERT INTO users (name, email, password) 
  VALUES ($1, $2, $3) 
  RETURNING *;`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guestId, limit = 10) {
  const queryParams = [guestId, limit];
  const queryString = `
  SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
  FROM reservations
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON property_reviews.property_id = properties.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  const clauses = [];

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    clauses.push(`city LIKE $${queryParams.length}`);
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    clauses.push(`owner_id = $${queryParams.length}`);
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    clauses.push(`cost_per_night >= $${queryParams.length}`);
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    clauses.push(`cost_per_night <= $${queryParams.length}`);
  }

  if (clauses.length > 0) {
    queryString += 'WHERE ';
    queryString += clauses.join(" AND ");
  }

  queryString += `
  GROUP BY properties.id`;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
    property.country,
    property.street,
    property.city,
    property.province,
    property.post_code
  ];

  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
  RETURNING *;`;

  return db
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
