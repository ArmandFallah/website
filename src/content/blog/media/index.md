---
title: 'The making of "Media"'
description: 'A realtime social media application'
date: 'July 11 2023'
---

https://armand.world/media/ | https://github.com/ArmandFallah/media

- Frontend: Typescript, React.js, Vanilla CSS
- Backend: node.js, express.js, PostgreSQL

My journey with media began during the summer of 2023. I was fresh out of Junior
year and had just started a one month stay in New York City with my brother.
During the school year, I had decided that I wanted to go into web development,
as it was the most interesting and applicable field for me. When I started that
summer, I only had a basic knowledge of Javascript, HTML, and CSS. I determined
that I would make a simplified clone of Twitter, as it was mostly text and I
already had an idea of how to build it.

My first iteration of media was made entirely with vanilla JS, and HTML. There
was no backend, so everything was stored on the browser. Over my first attempt,
I learned about the DOM, how to sustain a project across multiple files, how to
employ callbacks, and more. But my second try is where I really began to grow. I
planned to be able to host my second version on the web, so I needed to develop
a backend as well. After some research, I constructed a plan to make my website.
I would have a React frontend, API built with Node.js, and a PostgreSQL backend.
I started by learning basic syntax, hooks, and relevant libraries. I rebuilt the
application with React, still running on the browser, then moved towards the
backend. I started with the database, where I made a table to store the data of
the "tweets".

My next step would be the hardest of the process for me, the API. Moving from
frontend development to backend development was a tough step to take for me.
Learning the protocol and required libraries and technologies was the hardest
task in the entire process for me. At one point there were three days straight
where I made minimal to no progress, but after almost a week of inching forward,
I finally had my backend working. Finally being able to see the culmination of a
month's work was an unforgettable moment for me. I will always remember jumping
around the room when I saw my page update. I'm still in disbelief that I was
able to complete a project that once seemed impossible, but I can't stop myself
from thinking whats coming next.

## Technical Overview

![](architecture.png)

### Frontend

I built the frontend using React. In the beginning, one of the hardest concepts
for me to wrap my head around were props. The ability to pass out of scope
values into a custom component was an invaluable. I created two components, one
for specific tweets, and one for the application itself. Since I did all of my
data fetching inside application, I had to pass down the data into my "Tweet"
component as shown here: `function Tweet(props: TweetProps)` I'm using
TypeScript so TweetProps is a custom type I defined as so

```ts
type TweetProps = {
  textbox: string;
  id: number;
  name: string;
};
```

And these props are used here:

```ts
const id = tweet.id;
<Tweet textbox={tweet.value} key={id} id={id} name={tweet.name} />;
```

Where tweet was a predefined object with keys, value, id, and name.

#### Data Fetching With React Query

For my data fetching, I employed the react-query library. Here is how I fetch my
tweets:

```ts
const query = useQuery<QueryData>(['tweets'], getAllTweets);
```

The useQuery hook will call my function getAllTweets and populate it into the
tweets key. Here is what getAllTweets looks like inside my file client:

```ts
export const getAllTweets = async () => {
  const data = await fetch(`${API}/tweets`);
  return data.json();
};
```

This calls my API function for GET and returns all of the tweets in the database
in JSON format. If youre wondering what the value of the variable API is, take a
look:

```ts
export const API =
  process.env.NODE_ENV === 'production'
    ? 'https://armand.world/api/media'
    : 'http://localhost:3001/media';
```

You can see that for production deployments it points to
https://armand.world/api/media, while for development it points to
http://localhost:3001/media.

### Backend

I built a RESTful API using express.js. For example, when getAllTweets sent a
GET request, my API function for the /tweet endpoint, as seen below, was
executed

```js
router.get('/tweets', (request, response) => {
  pool.query('SELECT * FROM tweet', [], (err, result) => {
    response.json(result.rows);
  });
});
```

The .query method runs the given SQL command inside the database. It then uses a
callback to specify what to do with the response data. In this case, it sends
back the result, a list of all the tweets in the database, in json format.

When the API recieves a POST request, or a request to create a tweet, it runs
this code:

```js
router.post('/tweets', (request, response) => {
  const tweetValue = request.body.value;
  const tweetAuthor = request.body.name;
  if (tweetValue == null || tweetValue === '') {
    console.log('Value is null');
    console.log(request);
    response.status(500);
    return;
  }

  pool.query(
    'INSERT INTO tweet(value, name) VALUES ($1, $2) RETURNING id, value, name',
    [tweetValue, tweetAuthor],
    (err, result) => {
      if (err != null) {
        console.log(err);
        response.status(500);
      } else {
        console.log(result.rows);
        response.json(result.rows[0]);
      }
    }
  );
});
```

The function first checks to make sure the value isn't null then moves on to the
query. The query runs the SQL command which inserts the name and value into the
table, and recieves back the inputted value, name, and newly created id. The
data is then sent back to the frontend in json format.

#### The SQL

The table construction was the most simple part of my project. I needed a table
that could hold the text of the tweet, the author, and a unique identifier for
each one. SQL makes the creation very simple with the commands needed, listed
below, almost completely readable as English.

```sql
CREATE TABLE tweet (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT NOT NULL
);
```

In this snippet, I create a table called tweet with 3 columns: id, which
increments itself because of the SERIAL command, name which is text and cannot
be empty, and the value, which is also text and cannot be empty. After the
creation of my table, I was able to store and retrieve data effectively, but to
make my website realtime, I needed to further modify my code.

### Server Sent Events (SSE)

The first step to making my website realtime was to setup a notify function in
my database, using this command:

```sql
CREATE OR REPLACE FUNCTION notify_new_tweet()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_tweet', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This defines a function that is to be used as a trigger that returns the json of
the newly created row. The trigger is then created using the commands:

```sql
CREATE TRIGGER tweet_after_insert
AFTER INSERT ON tweet
FOR EACH ROW EXECUTE FUNCTION notify_new_tweet();
```

This command creates a trigger that executes notify_new_tweet when data is
inserted into the tweet table.

To listen for the notification on my API, I set up a GET function:

```js
router.get('/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders();

  // Listen for new tweets
  const client = await pool.connect();
  await client.query('LISTEN new_tweet');
  client.on('notification', (data) => {
    const payload = JSON.parse(data.payload);
    console.log('RECEIVED new row', payload);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => {
    client.release();
  });
});
```

The headers keep the connection alive constantly while the LISTEN command is
executed. As you can see, when a notification is recieved for new tweet, the
payload from the payload recieved is parsed into js, and then serialized to json
and sent back to the frontend.

When the payload is sent back to the frontend, it is handled and displayed by
the code below:

```tsx
useEffect(() => {
  const eventSource = new EventSource(`${API}/events`);
  eventSource.onmessage = (event) => {
    const newTweet = JSON.parse(event.data);
    queryClient.setQueryData<QueryData>(['tweets'], (tweets) => {
      if (tweets == null) {
        return [newTweet];
      }

      if (tweets.find((tweet) => tweet.id === newTweet.id) != null) {
        return tweets;
      }

      return [...tweets, newTweet];
    });
  };

  return () => {
    eventSource.close();
  };
}, []);
```

I created an event source to recieve the payload from the API. After the data is
recieved, I use the .setQueryData function to update the page. First, I parse
the data back into js. I then return a new array, with the new value included,
to display on the page.
