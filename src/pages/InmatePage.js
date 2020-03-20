import React, { useState, useEffect } from "react";

import { useParams } from "react-router-dom";

import { Grid, CircularProgress } from "@material-ui/core";
import { Card, CardHeader, CardContent } from "@material-ui/core";

import moment from "moment";

import {
  ConfirmationDialog,
  InfoTable as InmateInfoTable,
  RequestTable as InmateRequestTable,
  CommentTable as InmateCommentTable,
} from "../components";

const fetchHelper = async (url, method, data=undefined) => {
  return await fetch(url, {
    method: method,
    credentials: "same-origin",
    body: data && JSON.stringify(data),
    headers: {"Content-Type": "application/json"},
  });
};

const getRequestWarning = (requests, newRequest, timedelta) => {
  const datePostmarked = moment(newRequest.date_postmarked);

  const dates = (
    requests
    .filter((request) => request.action === "Filled")
    .map((request) => moment(request.date_postmarked))
  );

  const latestDate = ((dates.length > 0) && moment.max(dates)) || null;
  const minPostmarkDate = latestDate && latestDate.clone().add(timedelta, "days");

  if (minPostmarkDate && datePostmarked.isBefore(minPostmarkDate)) {
    const days = datePostmarked.clone().diff(latestDate, "days");
    if (days !== null && days < 0) {
      return "There is a filled request postmarked after this one.";
    } else if (days !== null && days === 0) {
      return "There is a filled request postmarked the same day as this one.";
    } else if (days !== null && days === 1) {
      return "This request is postmarked one day from date of last filled request.";
    } else if (days !== null) {
      return `This request is postmarked ${days} days from date of last filled request.`;
    } else {
      return "This request is postmarked too early from date of last filled request.";
    }
  }
};

const InfoCardContent = (props) => (
  <CardContent>
    <InmateInfoTable {...props.inmate} />
  </CardContent>
);

const RequestsCardContent = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessages, setDialogMessages] = useState([]);
  const [dialogHandler, setDialogHandler] = useState(null);

  const getUserFeedback = async (messages) => {
    setDialogMessages(messages)
    setDialogOpen(true);
    return await new Promise((resolve, reject) => {
      setDialogHandler(() => (
        (response) => {
          resolve(response);
          setDialogOpen(false);
        }
      ));
    });
  };

  const handleRequestAdd = async (newRequest) => {
    const datePostmarked = moment(newRequest.date_postmarked).format("YYYY-MM-DD");
    let request = {...newRequest, date_postmarked: datePostmarked};

    if (newRequest.action === "Filled") {
      function* iterateInmateWarnings(inmate) {
        yield inmate.entry_age_warning;
        yield inmate.release_warning;
        yield getRequestWarning(props.requests, newRequest, props.minPostmarkTimedelta);
      }

      const getInmateWarnings = (inmate) => {
        const warnings = Array.from(iterateInmateWarnings(inmate));
        return warnings.filter(Boolean);
      };

      const messages = getInmateWarnings(props.inmate);
      if (messages && messages.length > 0) {
        const feedback = await getUserFeedback(messages);
        if (feedback === "Toss") {
          request.action = "Tossed";
        }
      }
    }

    const url = `${props.urlBase}/request/${props.jurisdiction}/${props.id}`;
    const response = await fetchHelper(url, "POST", request);
    const json = await response.json();

    let [data, errors] = (response.ok) ? [json, []] : [null, json];

    if (data) {
      data.date_postmarked = moment(data.date_postmarked, "YYYY-MM-DD").toDate();
    }

    return [data, errors];
  };

  const handleRequestUpdate = async (oldRequest, newRequest) => {
    const datePostmarked = moment(newRequest.date_postmarked).format("YYYY-MM-DD");
    const request = {...newRequest, date_postmarked: datePostmarked};
    const url = `${props.urlBase}/request/${props.jurisdiction}/${props.id}/${oldRequest.index}`;
    const response = await fetchHelper(url, "PUT", request);
    const json = await response.json();

    let [data, errors] = (response.ok) ? [json, []] : [null, json]

    if (data) {
      data.date_postmarked = moment(data.date_postmarked, "YYYY-MM-DD").toDate();
    }

    return [data, errors];
  };

  const handleRequestDelete = async (oldRequest) => {
    const url = `${props.urlBase}/request/${props.jurisdiction}/${props.id}/${oldRequest.index}`;
    const response = await fetchHelper(url, "DELETE");
    return response.ok;
  };

  const downloadLabel = async (index) => {
    const element = document.createElement("a");
    const url = `${props.urlBase}/label/${props.jurisdiction}/${props.id}/${index}`;
    const headers = {"Content-Type": "image/png"};
    const response = await fetch(url, {headers});
    const blob = await response.blob();
    element.href = URL.createObjectURL(blob);
    element.click();
  };

  const printAction = (data) => ({
    icon: "print",
    tooltip: "Print label",
    disabled: data.action !== "Filled",
    onClick: (event, rowData) => {
      event.preventDefault();
      downloadLabel(data.index);
    }
  });

  return (
    <>
      <InmateRequestTable
        components={{Container: CardContent}}
        jurisdiction={props.jurisdiction} id={props.id}
        requests={props.requests}
        setRequests={props.setRequests}
        defaultDatePostmarked={props.defaultPostmarkDate}
        onRequestAdd={handleRequestAdd}
        onRequestUpdate={handleRequestUpdate}
        onRequestDelete={handleRequestDelete}
        actions={[printAction]}
      />
      <ConfirmationDialog
        open={dialogOpen}
        onClose={dialogHandler}
        messages={dialogMessages}
      />
    </>
  );
};

const CommentsCardContent = (props) => {

  const handleCommentAdd = async (newComment) => {
    const url = `${props.urlBase}/comment/${props.jurisdiction}/${props.id}`;
    const response = await fetchHelper(url, "POST", newComment);
    const json = await response.json();
    return (response.ok) ? [json, []] : [null, json]
  };

  const handleCommentUpdate = async (oldComment, newComment) => {
    const url = `${props.urlBase}/comment/${props.jurisdiction}/${props.id}/${oldComment.index}`;
    const response = await fetchHelper(url, "PUT", newComment);
    const json = await response.json();
    return (response.ok) ? [json, []] : [null, json]
  };

  const handleCommentDelete = async (oldComment) => {
    const url = `${props.urlBase}/comment/${props.jurisdiction}/${props.id}/${oldComment.index}`;
    const response = await fetchHelper(url, "DELETE");
    return response.ok;
  };

  return (
    <InmateCommentTable
      components={{Container: CardContent}}
      jurisdiction={props.jurisdiction} id={props.id}
      comments={props.comments}
      onCommentAdd={handleCommentAdd}
      onCommentUpdate={handleCommentUpdate}
      onCommentDelete={handleCommentDelete}
    />
  );
};

export default (props) => {

  const {jurisdiction, id} = useParams();
  const [json, setJson] = useState(null);
  const [inmate, setInmate] = useState(null);
  const [requests, setRequests] = useState([]);
  const [defaultPostmarkDate, setDefaultPostmarkDate] = useState(null);
  const [minPostmarkTimedelta, setMinPostmarkTimedelta] = useState(null);

  useEffect(() => {
    const processInmate = (inmate) => {
      inmate = {...inmate};
      inmate.requests.forEach((request) => {
        request.date_postmarked = moment(request.date_postmarked, "YYYY-MM-DD").toDate();
      });
      inmate.release = moment(inmate.release, "YYYY-MM-DD") || null;
      inmate.datetime_fetched = moment(inmate.datetime_fetched, "YYYY-MM-DD hh:mm:ss") || null;
      return inmate;
    };

    const getInmate = async (jurisdiction, id) => {
      const url = `${props.urlBase}/inmate/${jurisdiction}/${id}`;
      const response = await fetch(url);
      const json = await response.json();
      setJson(json);
      if (response.ok) {
        const inmate = processInmate(json.inmate);
        setInmate(inmate);
        setRequests(inmate.requests);
        setMinPostmarkTimedelta(json.minPostmarkTimedelta);
        setDefaultPostmarkDate(moment(json.datePostmarked, "YYYY-MM-DD").toDate());
      }
    };

    getInmate(jurisdiction, id);
  }, [props.urlBase, jurisdiction, id]);

  if (json && !inmate) {
    return <h3>No inmate matched given URL parameters.</h3>;
  }

  if (!inmate) {
    return <CircularProgress />;
  }

  return (
    <>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Inmate Information" />
        <InfoCardContent inmate={inmate} />
      </Grid>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Requests"/>
        <RequestsCardContent
          urlBase={props.urlBase}
          inmate={inmate}
          id={id} jurisdiction={jurisdiction}
          requests={requests}
          setRequests={setRequests}
          defaultPostmarkDate={defaultPostmarkDate}
          minPostmarkTimedelta={minPostmarkTimedelta}
        />
      </Grid>
      <Grid item xs={8} lg={4} component={Card} variant="outlined">
        <CardHeader title="Comments"/>
        <CommentsCardContent
          urlBase={props.urlBase}
          id={id} jurisdiction={jurisdiction}
          comments={inmate.comments}
        />
      </Grid>
    </>
  );
};
