import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";  // Added import for Order model

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
  {
    id:'sync-user-from-clerk'
  },
  { event: 'clerk/user.created' },
  async ({event}) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id:id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      imageUrl:image_url
    }
    await connectDB()
    await User.create(userData)
  }
)

// Inngest Function to update user data in database
export const syncUserUpdate = inngest.createFunction(
  {
    id: 'update-user-from-clerk'
  },
  { event: 'clerk/user.updated' },
  async ({event}) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      imageUrl: image_url
    }
    await connectDB()
    await User.findByIdAndUpdate(id, userData)
  }
)

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
  {
    id: 'delete-user-with-clerk'
  },
  { event: 'clerk/user.deleted' },
  async ({event}) => {
    const { id } = event.data

    await connectDB()
    await User.findByIdAndDelete(id)
  }
)

// Inngest Function to create order in database
export const createUserOrder = inngest.createFunction(
  {
    id:'create-user-order',
    batchEvents: {
      maxSize: 5,
      timeout: '5s'
    }
  },
  {event: 'order/created'},
  async ({events}) => {
    console.log("Received events:", events);  // Added logging to debug
    const orders = events.map((event) => {
      console.log("Processing event data:", event.data);  // Added logging to debug
      return {
        userId: event.data.userId,
        address: event.data.address,
        items: event.data.items,
        amount: event.data.amount,
        date: Date.now()
      }
    })
    await connectDB()
    await Order.insertMany(orders)
    console.log("Orders inserted:", orders);  // Added logging to confirm insertion

    return { success: true , processed: orders.length };
  }
)
