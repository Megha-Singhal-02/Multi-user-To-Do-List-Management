if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const path = require('path')
const express = require('express');
const app = express()
const bcrypt = require('bcryptjs')    //to make hashed password and check hashed password to make sure that our application is compelety secure
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mysql = require('mysql')
const ejs = require('ejs')

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('views', path.join(__dirname, '../frontend/views'))
app.use(express.static('database'))

const connection = require('./database/database.js');

const initializePassport = require('./config/passport-config.js')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

app.use(express.urlencoded({ extended: false }))   // doing this to tell our application
//to take these fonts from email and password ans to  be able to access then inside of our rquest variable inside our post method
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,       //going to encrypt all information for us
  resave: false,      // resave our session variable if nothing is changed
  saveUninitialized: false        //wants to save any empty value
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//homepage route
app.get('/', checkAuthenticated, (req, res) => {
  const userId = req.user.id;
  const selectedListId = req.query.list;

  if (!selectedListId || selectedListId === '--select--') {
    connection.query('Select * from todo_lists where user_id = ? ', [userId], (error, lists) => {
      if (error) {
        console.log("Error in fetching todo lists: ", error)
      }
      else {
        connection.query('Select * from tasks where todo_list_id IN (Select id from todo_lists where user_id = ? ) ', [userId], (error, tasks) => {
          if (error) {
            console.log("Error in fetching tasks: ", error)
          }
          else {
            res.render('front_page.ejs', { name: req.user.username, todoLists: lists, tasks: tasks, selectedListId: selectedListId })
          }
        })
      }
    })
  }
  else {
    connection.query('Select * from todo_lists where user_id = ? ', [userId], (error, lists) => {
      if (error) {
        console.log("Error in fetching todo lists: ", error)
      }
      else {
        connection.query('Select * from tasks where todo_list_id = ? and todo_list_id in (Select id from todo_lists where user_id = ?)', [selectedListId, userId], (error, tasks) => {
          if (error) {
            console.log('Error in displaying tasks for the list', error)
          }
          else {
            res.render('front_page.ejs', { name: req.user.username, todoLists: lists, tasks: tasks, selectedListId: selectedListId })
          }
        })
      }
    })
  }
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const userData = {
      username: req.body.name,
      email: req.body.email,
      password: hashedPassword
    }
    connection.query('Insert into users SET ?', userData, (error, results) => {
      if (error) {
        console.error('Error in inserting User: ', error)
      }
      else {
        console.log("User Registered Successfully");
        res.redirect('/login')
      }
    })
  } catch {
    res.redirect('/register')
  }
})

app.post('/logout', (req, res) => {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

//if not logged-in redirect them to login page 
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

//doesnot go back to login register page until it is logged in
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.get('/add-list', (req, res) => {
  res.render('addnewlist.ejs')
})

app.post('/add-list', (req, res) => {
  try {
    const userId = req.user.id;
    const listName = req.body.listname;
    connection.query('Insert into todo_lists set ?', { title: listName, user_id: userId }, (error, result) => {
      if (error) {
        console.log("Error in inserting data to database: ", error)
      }
      else {
        console.log("Data successfully inserted.")
        res.redirect('/')
      }
    })
  }
  catch {
    res.redirect('/add-list')
  }
})

app.get('/add-task', (req, res) => {
  const userId = req.user.id;
  const selectedListId = req.query.listId;
  connection.query('Select * from todo_lists where user_id =?', [userId], (error, rows) => {
    if (error) {
      console.log("error: ", error)
    }
    else {
      const listId = req.body.listId;
      // console.log(listId)
      res.render('addnewtask.ejs', { listNames: rows, selectedListId: selectedListId })
    }
  })
})

app.post('/add-task', (req, res) => {
  try {
    const listId = req.body.listId;
    const taskName = req.body.taskname;
    const taskDescription = req.body.taskdescription;
    const completionDate = new Date(req.body.tocomplete);
    const formattedDate = completionDate.toISOString().split('T')[0];
    // console.log(formattedDate)
    connection.query('Insert into tasks set ?', { 
      todo_list_id: listId, 
      tasks_title: taskName, 
      Description: taskDescription, 
      completed_by: formattedDate 
    }, (error, result) => {
      if (error) {
        console.log('Error in inserting data into database: ', error)
      }
      else {
        // console.log('Data inserted successfully.')
        res.redirect('/')
      }
    })
  }
  catch {
    res.redirect('/add-task')
  }
})

app.post('/delete-list', (req, res) => {
  const selectedListId = req.body.listId;

  connection.query('Delete from tasks where todo_list_id=?', [selectedListId], (error, results) => {
    if (error) {
      console.log("Error in deleting associated task from the list: ", error)
    }
    else {
      connection.query('Delete from todo_lists where id= ?', [selectedListId], (error, results) => {
        if (error) {
          console.log("Error in deleting the list:", error)
        }
        else {
          console.log("List deleted successfully")
          res.redirect('/')
        }
      })
    }
  })
})

app.post('/delete-task', (req, res) => {
  const selectedListId = req.body.listId
  const selectedTasks = Array.isArray(req.body.taskId) ? req.body.taskId : [req.body.taskId];

  connection.query('Delete from tasks where todo_list_id = ? and id in (?)', [selectedListId, selectedTasks], (error, results) => {
    if (error) {
      console.log("Error in deleting the task: ", error)
    }
    else {
      console.log("Tasks deleted successfully: ", results.affectedRows)
      res.redirect('/')
    }
  })
})

app.get('/edit-task', (req, res) => {
  const taskId = req.query.taskId;
  connection.query('Select * from tasks where id =?', [taskId], (error, result) => {
    if (error) {
      console.log(error)
    }
    else {
      if (result.length === 0) {
        res.send('Task not found.');
      }
      else {
        const task = result[0];
        const date = new Date(task.completed_by+'Z');
        // console.log('Date object:', date);
        const formattedDate = date.toISOString().split('T')[0];
        task.formattedDate = formattedDate;
        // console.log('Formatted Date:', task.formattedDate); // Log formatted date
        res.render('edit_task.ejs', { task: task });
      }
    }
  })
})

app.post('/update-task', (req, res) => {
  const taskId = req.body.taskId;
  const updatedTask = {
    tasks_title: req.body.taskname,
    Description: req.body.taskdescription,
    completed_by: new Date(req.body.tocomplete).toISOString().split('T')[0]
  }
  connection.query('Update tasks SET tasks_title = ?, Description = ?, completed_by = ? where id= ?', [updatedTask.tasks_title, updatedTask.Description, updatedTask.completed_by, taskId], (error, result) => {
    if (error) {
      console.log(error)
    }
    else {
      res.redirect('/')
    }
  })
})

app.listen(3000)




