import { useEffect, useReducer } from "react";
import "./App.css";
import Header from "./components/Header";
import Main from "./components/Main";
import Loader from "./components/Loader";
import Error from "./components/Error";
import StartScreen from "./components/StartScreen";
import Question from "./components/Question";
import NextButton from "./components/NextButton";
import Progress from "./components/Progress";
import Finished from "./components/Finished";
import Footer from "./components/Footer";
import Timer from "./components/Timer";

const initialState = {
  questions: [],
  status: "loading",
  index: 0,
  answer: null,
  points: 0,
  highScore: 0,
  secondRemaining : null
};

const SEC_PER_QUESTION = 30;

function reducer(state, action) {
  switch (action.type) {
    case "setQuestion":
      return {
        ...state,
        questions: action.payload.data,
        status: action.payload.status,
      };
    case "dataFailed":
      return { ...state, status: "error" };
    case "start":
      return { ...state, status: "active" , secondRemaining : state.questions.length * SEC_PER_QUESTION };
    case "newAnswer":
      // eslint-disable-next-line no-case-declarations
      const question = state.questions.at(state.index);
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };
    case "nextQuestion":
      return { ...state, index: state.index + 1, answer: null };
    case "finish":
        return {
          ...state,
          status: "finished",
          highScore:
          state.points > state.highScore ? state.points : state.highScore,
        };
      case "restart":
          return { ...initialState,status:'ready',questions : state.questions };
      case 'tick' :
        return {...state , secondRemaining : state.secondRemaining - 1 , status : state.secondRemaining === 0 ? 'finished' : state.status}
        default:
      throw new Error("No action");
  }
}

function App() {
  const [{ questions, status, index, answer, points , highScore , secondRemaining}, dispatch] = useReducer(
    reducer,
    initialState,
  );
  const numQuestions = questions.length;
  const maxPoints = questions.reduce((acc, curr) => acc + curr.points, 0);
  useEffect(function () {
    async function getQuestions() {
      try {
        const res = await fetch("http://localhost:8000/questions");
        if (!res.ok) throw new Error("No data fetch");
        const data = await res.json();
        dispatch({
          type: "setQuestion",
          payload: {
            data,
            status: "ready",
          },
        });
      } catch (error) {
        dispatch({ type: "dataFailed" });
        console.log(error);
      }
    }
    getQuestions();
  }, []);

  return (
    <>
      <div className="app">
        <Header />
        <Main>
          {status === "loading" && <Loader />}
          {status === "error" && <Error />}
          {status === "ready" && (
            <StartScreen
              numQuestions={numQuestions}
              dispatch={dispatch}
              numQuestions={numQuestions}
              index={index}
            />
          )}
          {status === "active" && (
            <>
              <Progress
                index={index}
                numQuestion={numQuestions}
                points={points}
                maxPoints={maxPoints}
                answer={answer}
              />
              <Question
                question={questions[index]}
                dispatch={dispatch}
                answer={answer}
              />
              <Footer>
              <Timer dispatch={dispatch} secondRemaining={secondRemaining}/>
              <NextButton
                dispatch={dispatch}
                answer={answer}
                numQuestions={numQuestions}
                index={index}
              />
              </Footer>
            </>
          )}
          {status === "finished" && (
            <Finished
              points={points}
              maxPoints={maxPoints}
              highScore={highScore}
              dispatch={dispatch}
            />
          )}
        </Main>
      </div>
    </>
  );
}

export default App;
