import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor({ id, email, password, name, createdAt }) {
    this.id = id || uuidv4();
    this.email = email;
    this.password = password;
    this.name = name;
    this.createdAt = createdAt || new Date().toISOString();
  }

  toItem() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      createdAt: this.createdAt,
    };
  }

  static fromItem(item) {
    return new User(item);
  }
}

export class Lot {
  constructor({
    id,
    userId,
    title,
    description,
    borrowerName,
    currency = 'INR',
    expectedCloseDate,
    createdAt,
    lastEditedAt,
    closed = false,
    closedAt,
    analytics
  }) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.borrowerName = borrowerName;
    this.currency = currency;
    this.expectedCloseDate = expectedCloseDate;
    this.createdAt = createdAt || new Date().toISOString();
    this.lastEditedAt = lastEditedAt;
    this.closed = closed;
    this.closedAt = closedAt;
    this.analytics = analytics;
  }

  toItem() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      borrowerName: this.borrowerName,
      currency: this.currency,
      expectedCloseDate: this.expectedCloseDate,
      createdAt: this.createdAt,
      lastEditedAt: this.lastEditedAt,
      closed: this.closed,
      closedAt: this.closedAt,
      analytics: this.analytics,
    };
  }

  static fromItem(item) {
    return new Lot(item);
  }
}

export class Transaction {
  constructor({
    id,
    lotId,
    userId,
    amount,
    type, // 'IN' or 'OUT'
    paymentType, // 'UPI' or 'Cash'
    date,
    description,
    createdAt
  }) {
    this.id = id || uuidv4();
    this.lotId = lotId;
    this.userId = userId;
    this.amount = parseFloat(amount);
    this.type = type;
    this.paymentType = paymentType;
    this.date = date || new Date().toISOString();
    this.description = description;
    this.createdAt = createdAt || new Date().toISOString();
  }

  toItem() {
    return {
      id: this.id,
      lotId: this.lotId,
      userId: this.userId,
      amount: this.amount,
      type: this.type,
      paymentType: this.paymentType,
      date: this.date,
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  static fromItem(item) {
    return new Transaction(item);
  }
}
