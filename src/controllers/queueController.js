import pool from "../models/db";

//when a user clicks on the play button
export const enqueueUser = async (userId, productId, turns) => {
    try {
        // Determine the next position in the queue
        const queueCount = await pool.query('SELECT COUNT(*) FROM queue WHERE product_id = $1 AND status = $2', [productId, 'waiting']);
        const position = parseInt(queueCount.rows[0].count) + 1;

        // Add the user to the queue
        const newQueueItem = await pool.query(
            'INSERT INTO queue (user_id, product_id, position, turns, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [userId, productId, position, turns, 'waiting']
        );

        // Update click count and price per click
        await updateClickCountAndPrice(productId);

        return newQueueItem.rows[0];
    } catch (error) {
        console.error('Failed to enqueue user:', error);
        throw new Error('Failed to enqueue user');
    }
};


//when the user clicks on the play button, their click is recorded and used in updating the new price of each click
//to charge the seller for
const updateClickCountAndPrice = async (productId) => {
    try {
        const clickData = await pool.query('SELECT * FROM clicks WHERE product_id = $1', [productId]);
        let clickCount = clickData.rows[0]?.click_count || 0;
        let pricePerClick = clickData.rows[0]?.price_per_click || 0.01;

        // Increment the click count
        clickCount += 1;

        // Adjust the price per click based on traffic (e.g., exponential growth)
        pricePerClick = pricePerClick * Math.pow(1.1, clickCount / 100);

        if (clickData.rowCount > 0) {
            await pool.query('UPDATE clicks SET click_count = $1, price_per_click = $2, updated_at = NOW() WHERE product_id = $3', [clickCount, pricePerClick, productId]);
        } else {
            await pool.query('INSERT INTO clicks (product_id, click_count, price_per_click, updated_at) VALUES ($1, $2, $3, NOW())', [productId, clickCount, pricePerClick]);
        }
    } catch (error) {
        console.error('Failed to update click count and price:', error);
        throw new Error('Failed to update click count and price');
    }
};

//will be called when a players' turns reaches 0 and they exit from playing
export const processPlayer = async (req, res) => {
    const {playerId, productId} = req.query;
    await pool.query('UPDATE queue SET status = $1 WHERE id = $2', ['completed', playerId]);
    //might edit this later such that the player at the top is deleted from the queue once they've completed their turn
    await processQueue(productId); // Process the next player in the queue
    res.status(201).json({message: "Player turn completed"});
};


//updates the queue after the current player finishes their turns
const processQueue = async (productId) => {
    try {
        // Get the current player
        const currentQueueItem = await pool.query('SELECT * FROM queue WHERE product_id = $1 AND status = $2 ORDER BY position ASC LIMIT 1', [productId, 'waiting']);
        if (currentQueueItem.rowCount === 0) return; // No players waiting

        const player = currentQueueItem.rows[0];
        await pool.query('UPDATE queue SET status = $1 WHERE id = $2', ['playing', player.id]);
        notifyQueuePosition(productId);

    } catch (error) {
        console.error('Failed to process queue:', error);
        throw new Error('Failed to process queue');
    }
};

const notifyQueuePosition = async (productId) => {
    try {
        const queueItems = await pool.query('SELECT * FROM queue WHERE product_id = $1 AND status = $2 ORDER BY position ASC', [productId, 'waiting']);
        
        queueItems.rows.forEach(async (item, index) => {
            if (index < 3) { // Notify top 3 players
                //the productId below can be processed into the actual product name through different methods like
                //cross-referencing it with the products in their carts, or just with the products in our products table
                await sendNotification(item.user_id, `Your turn is coming up! You are #${index + 1} in the queue for product ${productId}.`);
            }
        });
    } catch (error) {
        console.error('Failed to notify queue position:', error);
        throw new Error('Failed to notify queue position');
    }
};

//will be enabled when we put this into effect; can also use whatsapp at a cost; can also process it to their emails
// const twilio = require('twilio');
// const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendNotification = async (userId, message) => {
    try {
        const user = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
        if (user.rowCount > 0) {
            const phoneNumber = user.rows[0].phone;
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });
        }
    } catch (error) {
        console.error('Failed to send SMS notification:', error);
        throw new Error('Failed to send SMS notification');
    }
};


//this is the endpoint we'll hit up to get the response that we'll show to the users on the site that will depict their position on the queue
//this is displayed according to the products, cause each products might have it's own queue of players waiting for their turn
export const status = async (req, res) => {
    try {
        const { productId } = req.params;
        const queueStatus = await pool.query('SELECT * FROM queue WHERE product_id = $1 ORDER BY position ASC', [productId]); //we'll need to have a cron job that will be running on the server to hit up an endpoint to clear the queue table
        res.json(queueStatus.rows);
    } catch (error) {
        console.error('Failed to get queue status');
        res.status(500).json({ error: 'Failed to get queue status' });
    }
};

