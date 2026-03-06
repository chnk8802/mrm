# User Module Implementation Plan

## Overview
Create a comprehensive user management module where admin can create/manage users from the UI. No self-registration or email verification required for admin-created users.

---

## 1. Backend Implementation

### 1.1 Update User Model (Optional Enhancement)
**File:** `apps/server/models/User.js`

Consider adding:
- `isActive` field for soft delete (similar to Customer)
- Indexes for performance optimization

```javascript
// Suggested additions
isActive: { type: Boolean, default: true }

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
```

### 1.2 Create User Validation Schema
**File:** `packages/validators/src/user.schema.js`

```javascript
const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().min(5),
  password: z.string().min(6), // Required for new user creation
  role: z.enum(['admin', 'staff', 'technician', 'customer']).default('staff')
});

const userUpdateSchema = userSchema.partial().omit({ password: true });

const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['admin', 'staff', 'technician', 'customer']).optional(),
  isActive: z.coerce.boolean().optional()
});
```

### 1.3 Create User Controller
**File:** `apps/server/controllers/userController.js`

#### API Endpoints:

| Method | Endpoint | Description | Access |
|--------|----------|--------------|--------|
| POST | `/api/users` | Create new user | Admin only |
| GET | `/api/users` | List all users | Admin only |
| GET | `/api/users/:id` | Get single user | Admin only |
| PUT | `/api/users/:id` | Update user | Admin only |
| DELETE | `/api/users/:id` | Delete (soft) user | Admin only |
| PUT | `/api/users/:id/reset-password` | Reset user password | Admin only |

#### Key Functions:
- `createUser` - Admin creates new user with temporary password
- `getUsers` - List with pagination, search, role filter
- `getUserById` - Get single user details
- `updateUser` - Update user details (name, phone, address, role)
- `deleteUser` - Soft delete (set isActive = false)
- `resetPassword` - Admin resets user password

**Security Note:** 
- All endpoints require admin authentication
- Prevent admin from deleting themselves
- Validate email uniqueness

### 1.4 Create User Routes
**File:** `apps/server/routes/userRoutes.js`

```javascript
router.post('/', protect, createUser);
router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);
router.put('/:id/reset-password', protect, resetPassword);
```

### 1.5 Register Routes in Server
**File:** `apps/server/server.js`

```javascript
import userRoutes from './routes/userRoutes.js';
app.use('/api/users', userRoutes);
```

---

## 2. Frontend Implementation

### 2.1 Create User Service
**File:** `apps/client/src/services/userService.js`

```javascript
// Methods matching backend endpoints
- createUser(userData)
- getUsers(params)
- getUserById(id)
- updateUser(id, userData)
- deleteUser(id)
- resetPassword(id, newPassword)
```

### 2.2 Create User Pages

#### 2.2.1 User List Page
**File:** `apps/client/src/pages/UserList.jsx`

Features:
- Table with columns: Name, Email, Phone, Role, Status, Created, Actions
- Add User button
- Pagination with configurable page sizes
- Column-based sorting
- Search by name/email
- Filter by role and status
- Bulk delete functionality
- Edit/Delete action buttons

#### 2.2.2 Create User Page
**File:** `apps/client/src/pages/UserCreate.jsx`

Features:
- Form fields: Name, Email, Phone, Address, Role, Password
- Password generation option (auto-generate random password)
- Role selection dropdown
- Form validation
- Success/Error feedback

#### 2.2.3 Edit User Page
**File:** `apps/client/src/pages/UserEdit.jsx`

Features:
- Pre-populated form with existing data
- Password field optional (leave blank to keep current)
- Cannot change own role (if editing self)
- Form validation

#### 2.2.4 User Details Page
**File:** `apps/client/src/pages/UserDetails.jsx`

Features:
- Read-only view of user details
- Edit button
- Delete button (with self-deletion prevention)
- Reset password button

### 2.3 Update Routes
**File:** `apps/client/src/App.jsx`

```jsx
<Route path="/users" element={<UserList />} />
<Route path="/users/new" element={<UserCreate />} />
<Route path="/users/:id" element={<UserDetails />} />
<Route path="/users/:id/edit" element={<UserEdit />} />
```

### 2.4 Update Sidebar
**File:** `apps/client/src/components/Layout/Sidebar.jsx`

Add Users menu item (conditionally shown based on admin role - for future RBAC):
```javascript
{ icon: Users, label: 'Users', path: '/users' },
```

---

## 3. Self-Deletion Prevention (Frontend)

In UserDetails.jsx and UserList.jsx:

```javascript
const currentUserId = userData?._id; // From auth context

const handleDelete = async (userId) => {
  // Prevent self-deletion
  if (userId === currentUserId) {
    alert('You cannot delete your own account');
    return;
  }
  // Proceed with deletion...
};
```

---

## 4. Implementation Order

1. **Backend First:**
   - Update User model (optional)
   - Create validation schema
   - Create controller
   - Create routes
   - Register routes

2. **Frontend Second:**
   - Create service
   - Create pages (List → Create → Details → Edit)
   - Update App.jsx routes
   - Update Sidebar

3. **Testing:**
   - Test all CRUD operations
   - Verify self-deletion prevention
   - Test pagination, sorting, filtering

---

## 5. Future Enhancements (Post-RBAC)

- Role-based access control for menu items
- Role-based page access restrictions
- Activity logging
- Password expiry policies
- Two-factor authentication
- User profile pictures
