import App from "./pages/App";
import Error from "./pages/Error";
import EventPage from "./pages/EventPage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import UserProfile from "./pages/UserProfile";
import Home from "./pages/Home";

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
      },
      {
        path: "/events/:eventId",
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
    ],
  },
];

export default routes;
