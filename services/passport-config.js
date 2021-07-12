const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport')
var User = require('../models/users')
const bcrypt = require('bcrypt')

passport.serializeUser((user, done) => {
    done(null, user.username)
})
passport.deserializeUser(async (username, done) => { 
    const result = await User.find({
        "username": username,
    })
    if(result[0]){
        done(null, result[0])
    }
})

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const userPresent = await User.find({
                "username": username,
            })
            if (!userPresent.length) {
                done(null, false, 'user not registered')
            } else {
                if (await bcrypt.compare(password, userPresent[0]['password'])) {
                    done(null, userPresent[0], 'login successful !')
                } else {
                    done(null, false, 'login unsuccessful !')
                }
            }
        } catch(err) {
            done(err, false)
        }
    }
))