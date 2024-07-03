const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  age: {
    type: Number,
    min: 18,
    max: 65
  },
  email: {
    type: String,
    match: /.+\@.+\..+/,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    required: true
  }
});

const User = mongoose.model('User', userSchema);

const newUser = new User({
  name: 'John',
  age: 30,
  email: 'john@example.com',
  role: 'admin',
  phone:18462838
});
console.log(newUser)
// newUser.save(err => {
//   if (err) console.log('Error:', err.message);
//   else console.log('User saved successfully');
// });

const breakfastSchema = new Schema({
      eggs: {
        type: Number,
        min: [6, 'Too few eggs'],
        max: 12
      },
      bacon: {
        type: Number,
        required: [true, 'Why no bacon?']
      },
      drink: {
        type: String,
        enum: ['Coffee', 'Tea'],
        required: function() {
          return this.bacon > 3;
        }
      }
    });
    const Breakfast = mongoose.model('Breakfast', breakfastSchema);
    
    const badBreakfast = new Breakfast({
      eggs: 2,
      bacon: 0,
      drink: 'Milky'
    });
    console.log(badBreakfast)
//     let error = badBreakfast.validateSync();
//     assert.equal(error.errors['eggs'].message,
//       'Too few eggs');
//     assert.ok(!error.errors['bacon']);
//     assert.equal(error.errors['drink'].message,
//       '`Milk` is not a valid enum value for path `drink`.');
    
//     badBreakfast.bacon = 5;
//     badBreakfast.drink = null;
    
//     error = badBreakfast.validateSync();
//     assert.equal(error.errors['drink'].message, 'Path `drink` is required.');
    
//     badBreakfast.bacon = null;
//     error = badBreakfast.validateSync();
//     assert.equal(error.errors['bacon'].message, 'Why no bacon?');
    