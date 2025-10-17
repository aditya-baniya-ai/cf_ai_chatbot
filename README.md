# Cloudflare project Idea Assistant

Check it out here
https://1348118b.cf-ai-chatbot-an6.pages.dev/


# cf_ai_chatbot: AI-Powered Project Idea Assistant

This is an AI-powered chat application built entirely on the Cloudflare stack, as part of an assignment. It allows users to brainstorm project ideas with an AI assistant that remembers the context of the conversation.

---

## Core Components

* **Frontend**: Cloudflare Pages (Single Page Application)
* **Backend**: Cloudflare Workers
* **AI Model**: Llama 3 via Workers AI
* **Memory**: Cloudflare KV

---

## How to Set Up and Deploy

Follow these steps to get the project running on your own Cloudflare account.

### 1. Set Up the Project Locally

* Clone this repository.
* Make sure you have Node.js and npm installed.
* Install the Cloudflare CLI, Wrangler:
    ```bash
    npm install -g wrangler
    ```
* Log in to your Cloudflare account:
    ```bash
    wrangler login
    ```

### 2. Configure and Deploy the Worker

The Worker is the backend that handles the AI logic and memory.

* **Create a KV Namespace**: This will store the chat histories. Run the following command and save the outputted `id` and `preview_id`.
    ```bash
    wrangler kv:namespace create CHAT_HISTORY
    ```
* **Update `wrangler.toml`**: Open the `wrangler.toml` file and replace the placeholder values for `id` and `preview_id` with the ones you just generated.
* **Deploy the Worker**:
    ```bash
    wrangler deploy
    ```
    After deployment, Wrangler will output your Worker's URL. **Copy this URL for the next step.**

### 3. Configure and Deploy the Frontend

The frontend is the chat interface your users will interact with.

* **Update the Worker URL**: Open the `index.html` file and find the line:
    ```javascript
    const workerUrl = 'YOUR_WORKER_URL_HERE';
    ```
    Replace `YOUR_WORKER_URL_HERE` with the URL of the Worker you just deployed.

* **Deploy to Cloudflare Pages**:
    1.  Push your code to a new GitHub repository.
    2.  In the Cloudflare dashboard, go to **Workers & Pages** -> **Create application** -> **Pages**.
    3.  Connect your new GitHub repository.
    4.  For the build settings, select the **None** framework preset. The "Build command" and "Build output directory" can be left blank.
    5.  Click **Save and Deploy**.

### 4. Test Your Application 🎉

Once your Pages site is deployed, visit its URL. You should now be able to chat with your AI assistant!
