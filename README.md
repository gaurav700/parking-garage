# Parking Garage System Documentation

## Overview

A comprehensive parking garage management system built with Node.js and Express that handles parking spot reservations, payments, and user management across multiple garages.

## Product Requirements

1. **Reservation System**: Users can reserve parking spots and receive tickets/receipts
2. **Payment Integration**: Support for paying for parking spots
3. **High Consistency**: Prevents double-booking of the same spot
4. **Vehicle Type Support**: Handles different vehicle types (compact, regular, heavy)
5. **Dynamic Pricing**: Different pricing tiers for different vehicle types

## System Architecture

The system follows a client-server architecture with:
- **Frontend**: EJS templating with static assets
- **Backend**: Node.js with Express framework
- **Database**: SQLite with read replicas for scalability
- **Load Balancer**: For distributing traffic across database replicas

## API Endpoints

### Public Endpoints

#### Reserve Parking Spot
```
POST /reserve/:id
```
- **Description**: Reserve an available parking spot in a specific garage
- **Parameters**: 
  - `id` (path): Garage ID
- **Returns**: Reservation details including spot ID, start/end times, and reservation ID

#### Cancel Reservation
```
GET /cancel/:id
```
- **Description**: Cancel an existing reservation
- **Parameters**:
  - `id` (path): Reservation ID
- **Returns**: Cancellation confirmation message

#### Get Payment Information
```
GET /payment/:id
```
- **Description**: Retrieve payment details for a reservation
- **Parameters**:
  - `id` (path): Reservation ID
- **Returns**: Payment amount and status information

### Internal Endpoints

#### Create User Account
```
POST /create-account
```
- **Parameters**:
  - `email` (body): User email address
  - `password` (body): User password
  - `id` (body): User ID
- **Returns**: Account creation confirmation

#### User Login
```
POST /login
```
- **Parameters**:
  - `email` (body): User email
  - `password` (body): User password
- **Returns**: Login status and user ID

#### Calculate Payments
```
GET /calculate-payments/:reservation_id
```
- **Parameters**:
  - `reservation_id` (path): Reservation ID
- **Returns**: Duration and calculated payment amount

#### Get Available Spots
```
GET /free-spots
```
- **Query Parameters**:
  - `garage_id`: Target garage ID
  - `vehicle_type`: Type of vehicle (bike/car)
- **Returns**: List of available spot numbers

#### Allocate Spots
```
POST /allocate-spots
```
- **Parameters**:
  - `id` (body): Garage ID
  - `start_time` (body): Reservation start time
  - `end_time` (body): Reservation end time
- **Returns**: Reservation details with allocated spot

## Database Schema

### Reservations Table
- `id` (PK, serial): Unique reservation identifier
- `garage_id` (FK, int): Reference to garage
- `spot_id` (FK, int): Reference to parking spot
- `start_time` (timestamp): Reservation start time
- `end_time` (timestamp): Reservation end time
- `paid` (boolean): Payment status

### Garage Table
- `id` (PK, serial): Unique garage identifier
- `zipcode` (varchar): Garage location zipcode
- `rate_compact` (decimal): Pricing for compact vehicles
- `rate_reg` (decimal): Pricing for regular vehicles
- `rate_large` (decimal): Pricing for large vehicles

### Spots Table
- `id` (PK, serial): Unique spot identifier
- `garage_id` (FK, int): Reference to garage
- `vehicle_type` (enum): Type of vehicle spot supports
- `status` (enum): Current spot availability status

### Users Table
- `id` (PK, serial): Unique user identifier
- `email` (varchar): User email address
- `password` (varchar): User password (should be hashed)
- `first_name` (varchar): User's first name
- `last_name` (varchar): User's last name

### Vehicle Table
- `id` (PK, serial): Unique vehicle identifier
- `license` (varchar): Vehicle license plate
- `vehicle_type` (varchar): Type of vehicle

## Features

### Reservation Management
- **Spot Allocation**: Automatically finds and allocates available spots
- **Time-based Reservations**: 24-hour default reservation period
- **Unique Reservation IDs**: UUID-based reservation tracking
- **Cancellation Support**: Easy reservation cancellation

### Payment System
- **Dynamic Pricing**: $10 per hour rate calculation
- **Duration Tracking**: Automatic calculation of parking duration
- **Payment Status**: Tracking of paid/unpaid reservations

### Vehicle Type Support
- **Flexible Spot Assignment**: Bikes can use car spots when bike spots unavailable
- **Type-specific Queries**: Filter available spots by vehicle type
- **Pricing Tiers**: Different rates for different vehicle types

### Data Consistency
- **Transaction Safety**: Database operations ensure spot availability
- **Concurrent Access**: Prevents double-booking through proper locking
- **Real-time Updates**: Immediate spot status updates

## Configuration

### Environment Variables
- `PORT`: Server port (default: 8080)
- Database connection settings (configured in `./db` module)

### Default Setup
- **Garage Count**: 3 garages
- **Spots per Garage**: 24 spots each
- **Default Rate**: $10 per hour
- **Reservation Duration**: 24 hours

## Security Considerations

⚠️ **Important Security Notes**:
- Passwords are stored in plain text (should implement hashing)
- No authentication middleware on protected endpoints
- SQL injection prevention through parameterized queries
- Input validation needed for user inputs

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install express ejs
   ```

2. **Database Setup**:
   - Ensure SQLite database is configured
   - Run database migrations if available

3. **Start Server**:
   ```bash
   node app.js [port]
   ```

4. **Access Application**:
   - Web interface: `http://localhost:8080`
   - API endpoints: `http://localhost:8080/api`

## Future Enhancements

- **Authentication**: Implement JWT or session-based authentication
- **Password Security**: Add bcrypt hashing for passwords
- **Rate Limiting**: Implement API rate limiting
- **Validation**: Add comprehensive input validation
- **Monitoring**: Add logging and monitoring capabilities
- **Testing**: Implement unit and integration tests

## Architecture Diagram

The system uses a load-balanced architecture with:
- Multiple users connecting to the server
- Payment service integration (3rd party)
- Database with read replicas for scalability
- Load balancer for optimal performance

This design ensures high availability and scalability for the parking garage management system.
