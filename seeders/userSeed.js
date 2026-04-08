import { faker } from '@faker-js/faker';
import { User } from '../models/userSchema.js';

const createUser = async (numUser) => {
    try {
        const users = [];

        for (let i = 0; i < numUser; i++) {
            users.push({
                name: faker.person.fullName(),
                username: faker.internet.username(),
                email: faker.internet.email(),
                password: "password",
                bio: faker.lorem.sentence(10),
                avatar: {
                    public_id: faker.system.fileName(),
                    url: faker.image.avatar(),
                },
            });
        }

        const result = await User.insertMany(users);
        console.log(`${result.length} users created successfully`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

export { createUser };
