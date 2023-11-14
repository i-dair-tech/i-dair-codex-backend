# ri-codex-backend

### Run the backend locally

After cloning the project

## 1- Create the environment variables

- **Step1:** Open the backend project folder
- **Step2:** Create a file and name it ".env" ( at the same level with "src" folder )
- **Step3:** Add the environment variables to the ".env" file :

```
  DB_NAME= database name
  DB_USERNAME= database username
  DB_PASSWORD=database password
  HOST=database host
  IS_LOCAL_PATH= true or false
  IS_LOCAL= true or false
  PATH_TO_SAVE_DATASET= database path
  PORT= app port
  
```

## 2- Install the dependencies

```
 npm install

```
## 3- Run the application

```
 npm start

```

Now you should see in the console the message:

"Server started at port: 'port in .env file (if it exists) or 3001 (the default port)'"

### Run the tests

to run the tests you just have to run

```
 npm run test

```
