const mongoose = require("mongoose");
const casual = require('casual');
const { User, UserWithIndex } = require('./database/user');

const init = async () => {
    console.log("cleaning db");
    await Promise.all([User.deleteMany({}), UserWithIndex.deleteMany({})])
    console.log('db cleaned');

    const numberOfItems = 1000;
    console.log(`adding ${numberOfItems} users to the database`)
    await populateDBWithDummyData(numberOfItems);
    console.log(`finished populating the database with ${numberOfItems} users`)
}

const populateDBWithDummyData = (numberOfItems) => {
    const docs = [...new Array(numberOfItems)].map((_, index) => ({
        email: casual.email,
        name: casual.name,
        age: casual.integer(0, 50),
        details: casual.array_of_integers(100),
        birthDate: new Date(casual.date('YYYY-MM-DD')),
        favoriteFruit: index % 2 === 0 ? 'tomato' : 'potato'

    }))

    return Promise.all([UserWithIndex.insertMany(docs), User.insertMany(docs)])
}

(async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/perftest'), {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        }

        // call once
        // await init();

        const query = { age: { $gt: 22 } }

        const users = await User.find(query)
        console.log(`Found ${users.length} users ======= `);

        console.time('query')
        await User.find(query)
        console.timeEnd('query')

        console.time('query_with_index')
        await UserWithIndex.find(query)
        console.timeEnd('query_with_index')


        console.time('query_with_select')
        await User.find(query)
            .select({ name: 1, _id: 1, age: 1, email: 1 })
        console.timeEnd('query_with_select')

        console.time('query_with_select_index')
        await UserWithIndex.find(query)
            .select({ name: 1, _id: 1, age: 1, email: 1 })
        console.timeEnd('query_with_select_index')

        console.time('lean_query')
        await User.find(query).lean()
        console.timeEnd('lean_query')

        console.time('lean_with_index')
        await UserWithIndex.find(query).lean()
        console.timeEnd('lean_with_index')

        console.time('lean_with_select')
        await User.find(query)
          .select({ name: 1, _id: 1, age: 1, email: 1 })
          .lean()
        console.timeEnd('lean_with_select')
    
        console.time('lean_select_index')
        await UserWithIndex.find(query)
          .select({ name: 1, _id: 1, age: 1, email: 1 })
          .lean()
        console.timeEnd('lean_select_index')



        process.exit(0);
    } catch (error) {
        console.log(error);
    }
})()