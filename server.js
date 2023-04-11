let express = require("express");
let fs = require("fs");

let app = express();
app.use(express.json());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Methods",
		"GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD"
	);
	res.header(
		"Access-Control-Allow-Headers",
		"Origin,X-Requested-With,Content-Type,Accept"
	);
	next();
});

var port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Node app listening on port ${port}`));
let data = require("./data.js");
let { shops, products, purchases } = data;

let fname = "value.json";
app.get("/shops", (req, res) => {
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else res.send(JSON.parse(data).shops);
	});
});

app.post("/shops", function (req, res) {
	let body = req.body;
	fs.readFile(fname, "utf-8", (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let dataObj = JSON.parse(data);
			let shopsArray = dataObj.shops;
			let maxid = shopsArray.reduce(
				(acc, curr) => (curr.shopid > acc ? curr.shopid : acc),
				0
			);
			let newid = maxid + 1;
			let newShop = { ...body, shopid: newid };
			shopsArray.push(newShop);
			dataObj.shops = shopsArray;
			let data1 = JSON.stringify(dataObj);
			fs.writeFile(fname, data1, (err) => {
				if (err) res.status(404).send(err);
				else res.send(newShop);
			});
		}
	});
});

app.get("/products", (req, res) => {
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else res.send(JSON.parse(data).products);
	});
});

app.post("/products", function (req, res) {
	let body = req.body;
	fs.readFile(fname, "utf-8", (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let dataObj = JSON.parse(data);
			let { products } = dataObj;
			let maxid = products.reduce(
				(acc, curr) => (curr.productid > acc ? curr.productid : acc),
				0
			);
			let newid = maxid + 1;
			let newProduct = { productid: newid, ...body };
			products.push(newProduct);
			dataObj.products = products;
			let data1 = JSON.stringify(dataObj);
			fs.writeFile(fname, data1, (err) => {
				if (err) res.status(404).send(err);
				else res.send(newProduct);
			});
		}
	});
});

app.put("/products/:id", function (req, res) {
	let body = req.body;
	let id = +req.params.id;
	fs.readFile(fname, "utf-8", (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let dataObj = JSON.parse(data);
			let { products } = dataObj;
			let index = products.findIndex((st) => st.productid === id);
			if (index >= 0) {
				let productToUpdate = products[index];
				let updatedProduct = { ...productToUpdate, ...body };
				products[index] = updatedProduct;
				dataObj.products = products;
				let data1 = JSON.stringify(dataObj);
				fs.writeFile(fname, data1, function (err) {
					if (err) res.status(404).send(err);
					else res.send(updatedProduct);
				});
			} else res.status(404).send("No product found");
		}
	});
});

app.get("/purchases", (req, res) => {
	let { shop, product, sort } = req.query;
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let { purchases, shops, products } = JSON.parse(data);
			let arr1 = [...purchases];
			if (shop) {
				let id = +shops.find((s) => s.name === shop).shopid;
				arr1 = arr1.filter((a) => a.shopid === +id);
			}
			if (product){
                productArray = product.split(",");
                let ids = products.reduce((acc,curr)=>productArray.find(p=>p===curr.productname)? [...acc,curr.productid] : acc,[])
                console.log(ids)
                arr1 = arr1.filter((a) => ids.findIndex(i=>i===a.productid)>=0 );
            } 
			if (sort) {
				if (sort === "QtyAsc") arr1.sort((a, b) => a.quantity - b.quantity);
				if (sort === "QtyDesc") arr1.sort((a, b) => b.quantity - a.quantity);
				if (sort === "ValueAsc")
					arr1.sort((a, b) => a.price * a.quantity - b.price * b.quantity);
				if (sort === "ValueDesc")
					arr1.sort(
						(a, b) => -1 * (a.price * a.quantity - b.price * b.quantity)
					);
			}
			res.send(arr1);
		}
	});
});

app.get("/purchases/shops/:id", (req, res) => {
	let id = +req.params.id;
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else res.send(JSON.parse(data).purchases.filter((p) => p.shopid === id));
	});
});

app.get("/purchases/products/:id", (req, res) => {
	let id = +req.params.id;
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else res.send(JSON.parse(data).purchases.filter((p) => p.productid === id));
	});
});

app.get("/totalPurchase/shop/:id", (req, res) => {
	let shopid = +req.params.id;
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let { purchases } = JSON.parse(data);

			const totalPurchaseByProduct = purchases
				.filter((purchase) => purchase.shopid === shopid)
				.reduce((acc, purchase) => {
					const productid = purchase.productid;
					const quantity = purchase.quantity;
					let price = purchase.price;
					if (acc[productid]) {
						acc[productid] += quantity * price;
					} else {
						acc[productid] = quantity * price;
					}
					return acc;
				}, {});

			res.send(totalPurchaseByProduct);
		}
	});
});

app.get("/totalPurchase/product/:id", (req, res) => {
	let productid = +req.params.id;
	fs.readFile(fname, (err, data) => {
		if (err) res.status(404).send(err);
		else {
			let { purchases } = JSON.parse(data);

			const totalPurchaseByShop = purchases
				.filter((purchase) => purchase.productid === productid)
				.reduce((acc, purchase) => {
					const shopid = purchase.shopid;
					const quantity = purchase.quantity;
					let price = purchase.price;
					if (acc[shopid]) {
						acc[shopid] += quantity * price;
					} else {
						acc[shopid] = quantity * price;
					}
					return acc;
				}, {});

			res.send(totalPurchaseByShop);
		}
	});
});

app.post("/purchases", function (req, res) {
	let body = req.body;
	fs.readFile(
		fname,

		"utf-8",
		(err, data) => {
			if (err) res.status(404).send(err);
			else {
				let dataObj = JSON.parse(data);
				let { purchases } = dataObj;
				let maxid = purchases.reduce(
					(acc, curr) => (curr.purchaseid > acc ? curr.purchaseid : acc),
					0
				);
				let newid = maxid + 1;
				let newPurchase = { id: newid, ...body };
				purchases.push(newPurchase);
				dataObj.purchase = purchases;
				let data1 = JSON.stringify(dataObj);
				fs.writeFile(fname, data1, (err) => {
					if (err) res.status(404).send(err);
					else res.send(newPurchase);
				});
			}
		}
	);
});
