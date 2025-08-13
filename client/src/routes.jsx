import App from "./pages/App";
import Error from "./pages/Error";
import EventPage from "./pages/EventPage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import UserProfile from "./pages/UserProfile";
import Home from "./pages/Home";
import TheLounge from "./pages/TheLounge";
import About from "./pages/About";
import DirectMessagesPage from "./pages/DirectMessagesPage";
import UserProfileFriends from "./components/UserProfile/UserProfileFriends";
import UserProfileGetToKnowMe from "./components/UserProfile/UserProfileGetToKnowMe";
import UserProfileMyEvents from "./components/UserProfile/UserProfileMyEvents";
import EditProfile from "./components/UserProfile/EditProfile";

const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/users/:id",
        element: <UserProfile />,
        errorElement: <Error />,
        children: [
          {
            path: "/users/:id/friends",
            element: <UserProfileFriends />,
            errorElement: <Error />
          },
          {
            path: "/users/:id/get-to-know-me",
            element: <UserProfileGetToKnowMe />,
            errorElement: <Error />
          },
          {
            path: "/users/:id/events",
            element: <UserProfileMyEvents />,
            errorElement: <Error />
          },
          {
            path: "/users/:id/edit",
            element: <EditProfile />,
            errorElement: <Error />
          },
        ]
      },
      {
        path: "/events/:id",
        element: <EventPage />,
        errorElement: <Error />,
      },
      {
        path: "/login",
        element: <LogInPage />,
        errorElement: <Error />,
      },
      {
        path: "/signup",
        element: <SignUpPage />,
        errorElement: <Error />,
      },
      {
        path: "/thelounge",
        element: <TheLounge />,
        errorElement: <Error />,
      },
      {
        path: "/about",
        element: <About />,
        errorElement: <Error />,
      },
      {
        path: "/messages/:id",
        element: <DirectMessagesPage />,
        errorElement: <Error />,
      },
    ],
  },
];

export default routes;
