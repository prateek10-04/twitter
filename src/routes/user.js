const express = require('express')
const User = require('../models/user')
const Tweet = require('../models/tweet')
const router = new express.Router()
const auth = require('../auth/auth')

router.post('/users/signup', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        await user.save();
        res.status(200).send({ user: await user.getPublicData(), token: token });
    } catch (error) {
        console.log(error)
        if (error.name === 'MongoServerError' && error.code === 11000) {
            // Check if the error is a duplicate key error
            if (error.keyPattern.userName) {
                res.status(400).send({ message: 'This username is already taken' });
            } else if (error.keyPattern.email) {
                res.status(400).send({ message: 'Account already present with this email ID' });
            } else {
                res.status(500).send({ message: 'Unexpected duplicate key error' });
            }
        } else if(error.errors.password){
            // Handle other errors
            res.status(500).send({ message: 'Password cannot be of length less than 7' });
        }
    }
});



router.post('/users/login',async (req,res)=>{
    try{

    const user= await User.findByCredentials(req.body.email,req.body.password)
    const token = await user.generateAuthToken()
    res.status(200).send({message:'Logged in successfully',user:await user.getPublicData(),token:token})
    
    }
    catch(error){
        res.status(400).send({message:error.message})
    }
})

router.post('/users/logout',auth, async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()
        res.status(200).send('Logged out successfully!')
    }catch(error){
        res.status(500).send(error.message)
    }
})

router.delete('/users/me',auth,async (req,res)=>{   
    try {
        const user = req.user; 
        const result = await User.deleteOne({ _id: user._id });

        if (result.deletedCount === 0) {
            return res.status(404).send('User not found');
        }
        await Tweet.deleteMany({author:req.user.userName})
        res.status(200).send('User Deleted successfully')
    }
    catch(error){
        res.status(500).send()
    }
    
})

router.get('/users/me',auth,async (req,res)=>{
    try{
        res.status(200).send({user: await req.user.getPublicData(),token:req.token})
    }catch(error){
        res.status(500).send(error.message)
    }
})

module.exports = router