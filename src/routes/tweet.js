const express=require('express')
const Tweet = require('../models/tweet')
const router = new express.Router()
const User = require('../models/user')
const auth = require ('../auth/auth')
const path = require('path');


router.get('/tweets',async (req,res)=>{
    try{
         const tweets = await Tweet.find()
        
        const updatedTweets = await Promise.all(tweets.map(async (tweet) => {
            return await tweet.getPublicData()
        }))
        res.status(200).send(updatedTweets)
    }catch(error){
        res.status(500).send(error.message)
    }
})
router.get('/tweets/:tweetID',auth,async (req,res)=>{
    try{
        const tweet=await Tweet.findOne({_id:req.params.tweetID,author:req.user.userName})
        res.status(200).send(tweet)
    }catch(error){
        res.status(500).send(error.message)
    }
})

router.post('/tweets/post',auth,async (req,res)=>{
    const user = await User.findOne({ _id: req.user._id })
    const tweet = new Tweet({
        ...req.body,
        author : user.userName
    })
    try{
        await tweet.save()
        res.status(201).send(await tweet.getPublicData())
    }
    catch(error){
        res.status(500).send(error)
    }
})

router.patch('/tweets/update/:tweetID',auth,async (req,res)=>{
    if((Object.keys(req.body))[0]!=='content'){
        return res.status(400).send('Cannot update this feature')
    }
    try{
        const tweet = await Tweet.findOne({author:req.user.userName,_id:req.params.tweetID})
        if(!tweet){
            return res.status(400).send('No tweet found with this ID.')
        }
        tweet.content=req.body.content
        await tweet.save()
        res.status(200).send({message:'Tweet updated successfully!',tweet:tweet.content})
    }
    catch(e){
        res.status(500).send(e.message)
    }
})

router.delete('/tweets/delete/:tweetID',auth,async (req,res)=>{
    try{
        console.log(req.user.userName)
        const tweet = await Tweet.findOneAndDelete({author:req.user.userName,_id:req.params.tweetID})
        if(!tweet){
            return res.status(400).send('No tweet found with this ID')
        }
        res.status(200).send('Tweet deleted successfully!')
    }
    catch(error){
        res.status(500).send(error.message)
    }
})


module.exports = router