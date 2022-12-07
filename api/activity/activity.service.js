const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId
const asyncLocalStorage = require('../../services/als.service')

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('activity')
        // const activities = await collection.find(criteria).toArray()
        var activities = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    localField: 'byUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser'
                }
            },
            {
                $unwind: '$byUser'
            },
            {
                $lookup:
                {
                    localField: 'aboutUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'aboutUser'
                }
            },
            {
                $unwind: '$aboutUser'
            }
        ]).toArray()
        activities = activities.map(activity => {
            activity.byUser = { _id: activity.byUser._id, fullname: activity.byUser.fullname }
            activity.aboutUser = { _id: activity.aboutUser._id, fullname: activity.aboutUser.fullname }
            delete activity.byUserId
            delete activity.aboutUserId
            return activity
        })

        return activities
    } catch (err) {
        logger.error('cannot find activities', err)
        throw err
    }

}

async function remove(activityId) {
    try {
        const store = asyncLocalStorage.getStore()
        const { loggedinUser } = store
        const collection = await dbService.getCollection('activity')
        // remove only if user is owner/admin
        const criteria = { _id: ObjectId(activityId) }
        if (!loggedinUser.isAdmin) criteria.byUserId = ObjectId(loggedinUser._id)
        const {deletedCount} = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove activity ${activityId}`, err)
        throw err
    }
}


async function add(activity) {
    try {
        const activityToAdd = {
            byUserId: ObjectId(activity.byUserId),
            aboutUserId: ObjectId(activity.aboutUserId),
            txt: activity.txt
        }
        const collection = await dbService.getCollection('activity')
        await collection.insertOne(activityToAdd)
        return activityToAdd
    } catch (err) {
        logger.error('cannot insert activity', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.byUserId) criteria.byUserId = filterBy.byUserId
    return criteria
}

module.exports = {
    query,
    remove,
    add
}


