const db = db.getSiblingDB('memoryscape');

db.createUser({
  user: 'memoryscape_user',
  pwd: 'memoryscape_password',
  roles: [
    {
      role: 'readWrite',
      db: 'memoryscape',
    },
  ],
});

db.createCollection('users');
db.createCollection('capsules');
db.createCollection('memoryitems');
db.createCollection('notifications');
