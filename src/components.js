import React, { useState, useEffect } from "react";

import { TextField, Button, Tooltip, Badge } from "@material-ui/core";
import { FormControl, FormHelperText } from "@material-ui/core";
import { Table, TableBody, TableRow, TableCell, TableHead } from "@material-ui/core";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";

import MaterialTable, { MTableEditField, MTableEditRow } from "material-table";

export const FullName = (props) => {
  const url = props.url;
  const fullName = props.first + " " + props.last;
  const name = props.first && props.last && fullName;
  const name_with_url = name && <a href={url}>{name}</a>;
  return name_with_url || name || <>Not Available</>;
};

export const Unit = (props) => {
  const url = props && props.url;
  const name = props && props.name;
  const name_with_url = name && url && <a href={url}>{name}</a>;
  const name_only = name && <>{name}</>
  return name_with_url || name_only || <>Not Available</>;
};

export const FormattedID = (props) => {
  const id = props.id && ("00000000" + parseInt(props.id)).slice(-8);
  return <>{id || "Invalid"}</>;
};

export const Jurisdiction = (props) => {
  return <>{props.jurisdiction}</>;
};

export const Sex = (props) => {
  return <>{props.sex || "Not Available"}</>;
};

export const Release = (props) => {
  const release = (
    (props.release.format && props.release.format("M/DD/YYYY"))
    || props.release || "Not Available"
  );

  if (props.warning) {
    return (
      <Tooltip title={props.warning} color="secondary">
        <Badge variant="dot">
          {release}
        </Badge>
      </Tooltip>
    );
  } else {
    return <>{release}</>;
  }
};

export const LastVerified = (props) => {
  const datetime = (
    (props.datetime && props.datetime.format("M/DD/YYYY [at] HH:mm:ss"))
    || "Not Available"
  );

  if (props.warning) {
    return (
      <Tooltip title={props.warning} color="secondary">
        <Badge variant="dot">
          <>{datetime}</>
        </Badge>
      </Tooltip>
    );
  } else {
    return <>{datetime}</>;
  }
};

export const InfoTable = (props) => {
  const components = {
    "Name": (
      <FullName first={props.first_name} last={props.last_name} url={props.url}/>
    ),
    "Jurisdiction": (
      <Jurisdiction jurisdiction={props.jurisdiction}/>
    ),
    "ID": (
      <FormattedID id={props.id}/>
    ),
    "Sex": (
      <Sex sex={props.sex}/>
    ),
    "Unit": (
      <Unit {...props.unit}/>
    ),
    "Release": (
      <Release release={props.release} warning={props.release_warning} />
    ),
    "Last Verified": (
      <LastVerified
        datetime={props.datetime_fetched}
        warning={props.entry_age_warning}
      />
    ),
  };

  return (
    <Table>
      <TableBody>
        {Object.keys(components).map((key, index) => (
        <TableRow key={index}>
          <TableCell component="th" scope="row">
            {key + ":"}
          </TableCell>
          <TableCell>
            {components[key]}
          </TableCell>
        </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const DataTable = (props) => {
  const [errors, setErrors] = useState({});

  const EditField = (props) => {
    const field = props.columnDef.field;
    return (
      <FormControl error={ field in errors }>
        <MTableEditField {...props} />
        <FormHelperText>{ (field in errors) ? errors[field] : "" }</FormHelperText>
      </FormControl>
    );
  };

  const onRowAdd = async (newData) => {
    const [addedRow, errors] = await props.onRowAdd(newData);

    if (errors && errors.length > 0) {
      setErrors(errors);
      throw new Error("Bad response from server.")
    }

    if (addedRow) {
      props.setData(prevState => {
        const newState = [...prevState];
        newState.unshift(addedRow);
        return newState;
      });
    }
  };

  const onRowUpdate = async (newData, oldData) => {
    const [updatedRow, errors] = await props.onRowUpdate(oldData, newData);

    if (errors && errors.length > 0) {
      setErrors(errors);
      throw new Error("Bad response from server.")
    }

    if (updatedRow) {
      props.setData(prevState => {
        const newState = [...prevState];
        newState[newState.indexOf(oldData)] = updatedRow;
        return newState;
      });
    }
  };

  const onRowDelete = async (oldData) => {
    const ok = await props.onRowDelete(oldData);

    if (!ok) {
      throw new Error("Bad response from server.")
    }

    props.setData(prevState => {
      const newState = [...prevState];
      newState.splice(newState.indexOf(oldData), 1);
      return newState;
    });
  };

  const components = {
    EditField,
    ...(props.components || {})
  };

  const options = {
    search: false,
    showTitle: false,
    pageSize: 5,
    addRowPosition: "first",
    pageSizeOptions: [],
    minBodyHeight: "400px",
    maxBodyHeight: "400px",
    ...(props.options || {}),
  };

  let header = (props.localization && props.localization.header) || {};
  header = {actions: "", ...header};
  const localization = {header, ...(props.localization || {})};

  return (
    <MaterialTable
      {...props}
      data={props.data}
      options={options}
      components={components}
      editable={{
        onRowAdd: onRowAdd,
        onRowUpdate: onRowUpdate,
        onRowDelete: onRowDelete,
      }}
      localization={localization}
    />
  );
};

export const RequestTable = ({onRequestAdd, onRequestUpdate, onRequestDelete, ...props}) => {

  useEffect(() => {
    const add = document.querySelector("button[title='Add Request']");
    add && add.focus();
  });

  const EditRow = (props) => {
    useEffect(() => {
      if (props.mode === "add") {
        const save = document.querySelector("button[title='Save']");
        save && save.focus();

        return () => {
          setTimeout(() => {
            const selector = "tr[index='0'] button[title='Print label']";
            const save = document.querySelector(selector);
            save && save.focus();
          }, 500);
        };
      }
    });

    return <MTableEditRow {...props} />;
  };

  const components = {EditRow, ...(props.components || {})};

  let body = (props.localization && props.localization.body) || {};
  body = {
    addTooltip: "Add Request",
    deleteTooltip: "Delete Request",
    editTooltip: "Edit Request",
    ...body
  };

  const localization = {body, ...(props.localization || {})};

  return (
    <DataTable
      columns={[
        {
          title: "Postmark Date", field: "date_postmarked", type: "date",
          initialEditValue: props.defaultDatePostmarked
        },
        {
          title: "Action", field: "action", initialEditValue: "Filled",
          lookup: {Filled: "Filled", Tossed: "Tossed"}
        },
      ]}
      onRowAdd={onRequestAdd}
      onRowUpdate={onRequestUpdate}
      onRowDelete={onRequestDelete}
      {...props}
      data={props.requests}
      setData={props.setRequests}
      localization={localization}
      components={components}
    />
  );
};

export const CommentTable = ({onCommentAdd, onCommentUpdate, onCommentDelete, ...props}) => {
  const [comments, setComments] = useState(props.comments);

  let body = (props.localization && props.localization.body) || {};
  body = {
    addTooltip: "Add Comment",
    deleteTooltip: "Delete Comment",
    editTooltip: "Edit Comment",
    ...body
  };

  const localization = {body, ...(props.localization || {})};

  return (
    <DataTable
      columns={[
        {title: "Comment", field: "body"},
        {title: "Author", field: "author"},
        {title: "Date", field: "datetime", type: "date", editable: "never"},
      ]}
      onRowAdd={onCommentAdd}
      onRowUpdate={onCommentUpdate}
      onRowDelete={onCommentDelete}
      {...props}
      data={comments}
      setData={setComments}
      localization={localization}
    />
  );
};

export const SearchResultsTable = (props) => {
  const useStyles = makeStyles(theme => ({
    tableRow: {
      cursor: "pointer",
    }
  }));
  const classes = useStyles();

  const fields = ["Name", "Jurisdiction", "ID", "Unit"];
  const ResultsTableHead = () => (
    <TableHead>
      <TableRow>
        {fields.map((field, index) => (
        <TableCell component="th" scope="row" key={index}>
          {field + ":"}
        </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const ResultsTableRow = (props) => {
    const components = [
      <FullName first={props.first_name} last={props.last_name} />,
      <Jurisdiction jurisdiction={props.jurisdiction} />,
      <FormattedID id={props.id} />,
      <Unit {...props.unit} />,
    ];

    return (
      <TableRow
        hover className={classes.tableRow}
        onClick={() => {
          props.onClick && props.onClick(props.jurisdiction, props.id);
        }}
      >
        {components.map((component, index) => (
        <TableCell key={index}>
          {component}
        </TableCell>
        ))}
      </TableRow>
    );
  };

  const ResultsTableBody = (props) => (
    <TableBody>
      {props.inmates.map((inmate, index) => (
      <ResultsTableRow key={index} {...inmate} onClick={props.onClick} />
      ))}
    </TableBody>
  );

  return (
    <Table>
      <ResultsTableHead />
      <ResultsTableBody inmates={props.inmates} onClick={props.onClick} />
    </Table>
  );
};

export const SearchForm = (props) => {
  const [query, setQuery] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit && props.onSubmit(query);
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        required
        label="inmate name or ID number"
        type="search" variant="outlined"
        error={Boolean(props.error)}
        helperText={props.error}
        onChange={handleChange}
      />
    </form>
  );
};

export const ConfirmationDialog = (props) => {
  return (
    <Dialog
      open={props.open}
      keepMounted
      aria-labelledby="alert-dialog-slide-title"
    >
      <DialogTitle id="alert-dialog-slide-title">
        Warnings for this Request
      </DialogTitle>
      <DialogContent>
        The following problems were observed with this request:
        <ul>
        {props.messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {props.onClose && props.onClose("Toss")}} color="primary">
          Toss
        </Button>
        <Button onClick={() => {props.onClose && props.onClose("Fill")}} color="primary">
          Fill anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};
