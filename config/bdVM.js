const mongoose = require("mongoose");

const dbvm = async () => {
  await mongoose.connect(process.env.MONGODB_URLVM, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connect");
};

module.exports = dbvm;
