const router = require('express').Router();
const path = '../views/user/';
const href = 'http://localhost:5000/';


const cquery = async  (sql,req,res)=>{
    return new Promise((resolve,reject)=>{
        connection.query(sql,(err,result)=>{
            if(err) console.log(err);
            else resolve(result);
        })
    }
    )
}

let books = [];
let users = [];
router.get('/books',async(req,res)=>{
    res.render(path+'books.ejs',{path : href});
})

router.get('/home',async (req,res)=>{
    let userid=req.user.accountID;
    let temp = await cquery(`select name,address from user where userID=${userid};`);
    let name = temp[0].name;
    let address = temp[0].address;
    console.log(temp);
    res.render(path+'user_home.ejs',{path : href,name,address,userid});
});

router.get('/temp',(req,res)=>{
    res.render(path+'temp',{path : href});
})


router.post('/getbooksdata',async (req,res)=>{
    let c = req.body.criteria;
    let sub=req.body.sub;
    if(books.length == 0){
        console.log('called');
        books = await cquery('select * from book;');
    }
    if(sub.length == 0){
        res.send({});
    }else{
        let result = [];
        for(let i=0;i<books.length;i++){
            let temp1 = await cquery(`call detailsOfBook(${req.user.accountID},${books[i].ISBN})`);
            // console.log(temp1);
            let str="";
            if(c== "Search by Name"){
                str = ""+books[i].title.toUpperCase();
            }else{
                str = ""+books[i].authors.toUpperCase();
            }
            console.log(books[i].title);
            // console.log(books[i].ISBN,str.indexOf(sub));
            if(str.indexOf(sub.toUpperCase()) > -1){
                // temp1[0][0].avgRat = temp1[0][0]["avg(rating.rating)"];
                temp1[0][0].ISBN = books[i].ISBN;
                let temp2 = await cquery(`call reviewsOfBook(${books[i].ISBN});`);
                let temp3 = await cquery(`select count(bookCopiesUser.userID) as count from bookCopiesUser where bookCopiesUser.ISBN = ${books[i].ISBN} and bookCopiesUser.action = 'hold';`);
                temp1[0][0].numholds = temp3[0].count;
                temp1[0][0].reviews = temp2[0];
                // console.log(temp1[1]);
                result.push(temp1[0][0]);
            }
        }
        // console.log(result)
        res.send(result);
    }

})

router.post('/markfav', async(req,res)=>{
    let isbn = req.body.isbn;
    let read = req.body.read;
    if(read == 'yes'){
        read=1;
    }else{
        read=0;
    }
    await cquery(`call markAsFavourite(${req.user.accountID},${isbn},${read});`);
    res.send({
        message: 'successs'
    })
})

router.post('/unmarkfav',async(req,res)=>{
    let isbn=req.body.isbn;
    await cquery(`call removeFromFavourite(${req.user.accountID},${isbn});`);
    res.send({
        message: 'success'
    })
})

router.post('/rate',async(req,res)=>{
    let isbn =req.body.isbn;
    let rating = req.body.rating;
    console.log(isbn,rating);
    await cquery(`call rateBookWithUser(${req.user.accountID},${isbn},${rating})`);
})

router.post('/requesthold',async(req,res)=>{
    let isbn = req.body.isbn;
    console.log(isbn);
    await cquery(`call requestHold(${req.user.accountID},${isbn},@status);`);
    let status = await cquery(`select @status;`);
    res.send(status[0]);
    console.log(status);
})

router.get('/friends',(req,res)=>{
    res.render(path + 'friends.ejs', {path : href});
})

router.post('/findfriends',async (req,res)=>{
    let sub = req.body.sub; 
    if(users.length == 0){
        users = await cquery(`select * from user where userId <> ${req.user.accountID};`);
    }
    let result=[];
    users.forEach(user => {
        if(user.name.toUpperCase().indexOf(sub.toUpperCase()) > -1){
            result.push(user);
        }
    })
    console.log(result);
    res.send(result);
})

module.exports = router;