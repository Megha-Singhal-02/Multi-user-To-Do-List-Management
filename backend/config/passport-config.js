const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const {connection,sessionStore} = require('../database/database.js')

function initialize(passport, getUserByEmail,getUserById)
{
    const authenticateUser = (email,password,done) =>{
        connection.query('Select * from users where email = ?',[email], async (error,result)=>{
            if(error)
            {
                return done(error);
            }
            if(!result || result.length ===0)
            {
                //done(error, userfound, message to display)
                return done(null, false, {message: "No User with that email"})               
            }
            try 
            {
                if (await bcrypt.compare(password, result[0].password)) 
                {
                    return done(null, result[0]);
                } 
                else 
                {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (error) {
                return done(error);
            }
        })  
    }
    passport.use(new LocalStrategy({usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => {
        done(null,user.id)      //done(error, user.id)
    })   
    passport.deserializeUser((id, done) => {
        connection.query('Select * from users where id= ?',[id], (error,result)=>{
            if(error)
            {
                return done(error);
            }
            if (result.length===0) {
                return done(null, false,{mesage: 'User not found'});
            }
            return done(null, result[0]);
        });
    });
}

module.exports = initialize