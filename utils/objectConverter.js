exports.userResponse = (users) => {
    const userResult = [];
    users.forEach((user) => {
        userResult.push({
            _id: user._id,
            name: user.name,
            userId: user.userId,
            email: user.email,
            userType: user.userType,
            userStatus: user.userStatus,
            companyId: user.companyId || null,
            departmentId: user.departmentId || null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    });
    return userResult;
};
