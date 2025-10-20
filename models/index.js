const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcryptjs = require('bcryptjs');

// Verify Sequelize instance
if (!sequelize || typeof sequelize.define !== 'function') {
  console.error('Sequelize instance is not properly initialized');
  process.exit(1);
}

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  drugsngUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  drugsngToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcryptjs.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcryptjs.hash(user.password, 10);
      }
    }
  },
  tableName: 'users'
});

// Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products'
});

// Doctor Model
const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'doctors'
});

// Order Model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Processing', 'Shipped', 'Delivered', 'Cancelled'),
    defaultValue: 'Processing'
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('Flutterwave', 'Paystack', 'Cash on Delivery'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Failed'),
    defaultValue: 'Pending'
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  drugsngOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'orders'
});

// OrderItem Model
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'order_items'
});

// Appointment Model
const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id'
    }
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'),
    defaultValue: 'Scheduled'
  },
  notes: {
    type: DataTypes.TEXT
  },
  drugsngAppointmentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'appointments'
});

// Session Model
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  state: {
    type: DataTypes.ENUM('NEW', 'REGISTERING', 'REGISTERED', 'LOGGING_IN', 'LOGGED_IN', 'SUPPORT_CHAT'),
    defaultValue: 'NEW'
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  supportTeamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'support_teams',
      key: 'id'
    }
  }
}, {
  tableName: 'sessions'
});

// SupportTeam Model
const SupportTeam = sequelize.define('SupportTeam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('general', 'orders', 'medical', 'technical'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'support_teams'
});

// SupportChat Model
const SupportChat = sequelize.define('SupportChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  supportTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: SupportTeam,
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isFromCustomer: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'support_chats'
});

// Cart Model
const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'carts'
});

// OTP Model for email verification
const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'password_reset', 'email_verification'),
    defaultValue: 'email_verification'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'otps',
  indexes: [
    {
      fields: ['email', 'purpose']
    }
  ]
});

// Diagnostic Tests Model
const DiagnosticTest = sequelize.define('DiagnosticTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  sampleType: {
    type: DataTypes.STRING,
    comment: 'e.g., Blood, Urine, Saliva'
  },
  collectionTime: {
    type: DataTypes.STRING,
    comment: 'e.g., 30 minutes, 1 hour'
  },
  resultTime: {
    type: DataTypes.STRING,
    comment: 'e.g., 24 hours, 48 hours'
  },
  labPartner: {
    type: DataTypes.STRING,
    comment: 'Name of the lab providing the test'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'diagnostic_tests'
});

// Healthcare Products Model
const HealthcareProduct = sequelize.define('HealthcareProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., First Aid, Medical Devices, Health Supplements'
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  brand: {
    type: DataTypes.STRING
  },
  usage: {
    type: DataTypes.TEXT,
    comment: 'How to use the product'
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'healthcare_products'
});

// Diagnostic Test Booking Model
const DiagnosticBooking = sequelize.define('DiagnosticBooking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  diagnosticTestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: DiagnosticTest,
      key: 'id'
    }
  },
  sampleCollectionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sampleCollectionLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'Pending'),
    defaultValue: 'Pending'
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Failed'),
    defaultValue: 'Pending'
  },
  paymentReference: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'diagnostic_bookings'
});

// Support Rating Model
const SupportRating = sequelize.define('SupportRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  supportChatId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customerPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  supportTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'support_teams',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT
  },
  ratedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'support_ratings'
});

// Prescription Model for medicine orders
const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL or path to the prescription file (PDF/Image)'
  },
  extractedText: {
    type: DataTypes.TEXT,
    comment: 'OCR extracted text from prescription'
  },
  verificationStatus: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
    defaultValue: 'Pending'
  },
  pharmacistNotes: {
    type: DataTypes.TEXT
  },
  verifiedBy: {
    type: DataTypes.STRING,
    comment: 'Pharmacist name or ID'
  },
  verifiedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'prescriptions'
});

// Define relationships
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Appointment, { foreignKey: 'userId' });
Appointment.belongsTo(User, { foreignKey: 'userId' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Session.belongsTo(SupportTeam, { foreignKey: 'supportTeamId' });
SupportTeam.hasMany(Session, { foreignKey: 'supportTeamId' });

SupportChat.belongsTo(SupportTeam, { foreignKey: 'supportTeamId' });
SupportTeam.hasMany(SupportChat, { foreignKey: 'supportTeamId' });

User.hasMany(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Cart, { foreignKey: 'productId' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(DiagnosticBooking, { foreignKey: 'userId' });
DiagnosticBooking.belongsTo(User, { foreignKey: 'userId' });

DiagnosticTest.hasMany(DiagnosticBooking, { foreignKey: 'diagnosticTestId' });
DiagnosticBooking.belongsTo(DiagnosticTest, { foreignKey: 'diagnosticTestId' });

Order.hasMany(Prescription, { foreignKey: 'orderId' });
Prescription.belongsTo(Order, { foreignKey: 'orderId' });

SupportTeam.hasMany(SupportRating, { foreignKey: 'supportTeamId' });
SupportRating.belongsTo(SupportTeam, { foreignKey: 'supportTeamId' });

// Initialize database with proper error handling
const initializeDatabase = async () => {
  try {
    // First, test the connection
    await sequelize.authenticate();
    console.log('✓ Database connection verified');

    // Sync models
    await sequelize.sync({ alter: true }); // Use alter to safely modify existing tables
    console.log('✓ Database models synchronized successfully');

    // Seed initial data if needed
    await seedInitialData();
    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('❌ Error synchronizing database models:', error.message);
    throw error; // Re-throw to be handled by caller
  }
};

// Seed initial data with better error handling
const seedInitialData = async () => {
  try {
    // Seed support teams
    const supportTeamCount = await SupportTeam.count();
    if (supportTeamCount === 0) {
      try {
        const { supportTeams } = require('../config/support');
        const teamsToCreate = supportTeams.map(({ id, ...team }) => team);
        await SupportTeam.bulkCreate(teamsToCreate, { ignoreDuplicates: true });
        console.log('✓ Support teams seeded');
      } catch (error) {
        console.warn('⚠️  Could not seed support teams:', error.message);
      }
    }

    // Seed products
    const productCount = await Product.count();
    if (productCount === 0) {
      try {
        const sampleProducts = [
          { name: "Paracetamol 500mg", category: "Analgesic", description: "Pain relief medication", price: 500, stock: 100, isActive: true },
          { name: "Insulin Vial", category: "Anti-diabetic", description: "Diabetes medication", price: 2000, stock: 50, isActive: true },
          { name: "Amoxicillin 500mg", category: "Antibiotic", description: "Antibiotic medication", price: 800, stock: 75, isActive: true },
          { name: "Vitamin C Tablets", category: "Vitamins", description: "Immune system support", price: 300, stock: 200, isActive: true },
          { name: "Blood Pressure Monitor", category: "Healthcare Devices", description: "Home BP monitoring device", price: 5000, stock: 30, isActive: true },
          { name: "Cough Syrup", category: "Cough & Cold", description: "Effective cough relief", price: 400, stock: 150, isActive: true },
          { name: "Multivitamins", category: "Vitamins", description: "Daily vitamin supplement", price: 1200, stock: 80, isActive: true },
          { name: "Hand Sanitizer", category: "Hygiene", description: "70% alcohol hand sanitizer", price: 250, stock: 200, isActive: true }
        ];

        await Product.bulkCreate(sampleProducts, { ignoreDuplicates: true });
        console.log('✓ Sample products seeded');
      } catch (error) {
        console.warn('⚠️  Could not seed products:', error.message);
      }
    }

    // Seed doctors
    const doctorCount = await Doctor.count();
    if (doctorCount === 0) {
      try {
        const sampleDoctors = [
          { name: "Dr. Adaobi", specialty: "Cardiologist", location: "Lagos", available: true, rating: 4.8, isActive: true },
          { name: "Dr. Ken", specialty: "Pediatrician", location: "Abuja", available: true, rating: 4.5, isActive: true },
          { name: "Dr. Ngozi", specialty: "Dermatologist", location: "Port Harcourt", available: true, rating: 4.7, isActive: true },
          { name: "Dr. Tunde", specialty: "General Practitioner", location: "Kano", available: true, rating: 4.6, isActive: true },
          { name: "Dr. Fatima", specialty: "Gynecologist", location: "Enugu", available: true, rating: 4.9, isActive: true },
          { name: "Dr. Chukwu", specialty: "Neurologist", location: "Lagos", available: true, rating: 4.7, isActive: true },
          { name: "Dr. Okafor", specialty: "Orthopedic", location: "Abuja", available: false, rating: 4.4, isActive: true }
        ];

        await Doctor.bulkCreate(sampleDoctors, { ignoreDuplicates: true });
        console.log('✓ Sample doctors seeded');
      } catch (error) {
        console.warn('⚠️  Could not seed doctors:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding initial data:', error.message);
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Doctor,
  Order,
  OrderItem,
  Appointment,
  Session,
  SupportTeam,
  SupportChat,
  Cart,
  OTP,
  DiagnosticTest,
  HealthcareProduct,
  DiagnosticBooking,
  SupportRating,
  Prescription,
  initializeDatabase
};
