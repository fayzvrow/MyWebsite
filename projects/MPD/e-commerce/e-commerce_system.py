class Product:
  def __init__(self, name, price, category, stock):
    self.name = name
    self.price = price
    self.category = category
    self.stock = stock

  def __str__(self):
    return f"{self.name} - ${self.price} ({self.category}) - Stock: {self.stock}"

class Cart:
  def __init__(self):
    self.items = []

  def add_item(self, product, quantity):
    if product.stock >= quantity:
      product.stock -= quantity
      self.items.append((product, quantity))
      print(f"Added {quantity} of {product.name} to the cart.")

  def view_cart(self):
    print("\nCart Items: ")
    total = 0
    for product, quantity in self.items:
      print(f"{product.name} ({product.price}) - ${product.price * quantity}")
      total += product.price * quantity
    print(f"Total: ${total}")

  def checkout(self):
    print("Checkout successful!")
    self.items.clear()

class User:
  def __init__(self, username):
    self.username = username
    self.cart = Cart()

  def __str__(self):
    return f"\nUser: {self.username}"

class Store:
  def __init__(self):
    self.products = []

  def add_product(self, product):
      self.products.append(product)
      print(f"Added product: {product.name}")

  def list_products(self):
    print("\nAvailable Products: ")
    for product in self.products:
      print(product)
    print("")


store = Store()

store.add_product(Product("Macbook Air", 1000, "Electronics", 7))
store.add_product(Product("iPhone 16", 800, "Electronics", 10))
store.add_product(Product("AirPods Pro", 200, "Electronics", 50))

user = User("Fayz")
print(user)

store.list_products()

p1 = int(input("Enter the product you want: "))
q1 = int(input("How many would you like?: "))

p2 = int(input("Enter the product you want: "))
q2 = int(input("How many would you like?: "))

user.cart.add_item(store.products[p1], q1)
user.cart.add_item(store.products[p2], q2)

user.cart.view_cart()
user.cart.checkout()

store.list_products()