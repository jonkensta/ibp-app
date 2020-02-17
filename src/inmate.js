import React, { useState } from 'react';

import {
  FormControl,
  FormHelperText,
  Table,
  TableRow,
  TableBody,
  TableCell,
} from '@material-ui/core';

import MaterialTable, { MTableEditField } from "material-table";


export function FullName(props) {
  const url = props.url;
  const fullName = props.first + ' ' + props.last;
  const name = props.first && props.last&& fullName;
  const name_with_url = name && <a href={url}>{name}</a>;
  return name_with_url || name || <>Not Available</>;
}

export function Unit(props) {
  const url = props && props.url;
  const name = props && props.name;
  const name_with_url = name && url && <a href={url}>{name}</a>;
  const name_only = name && <>{name}</>
  return name_with_url || name_only || <>Not Available</>;
}

export function FormattedID(props) {
  const id = props.id && ("00000000" + parseInt(props.id)).slice(-8);
  return <>{id || "Invalid"}</>;
}

export function Jurisdiction(props) {
  return <>{props.jurisdiction}</>;
}

export function Sex(props) {
  return <>{props.sex || "Not Available"}</>;
}

export function Release(props) {
  return <>{props.release || "Not Available"}</>;
}

export function InfoTable(props) {
  const components = {
    'Name': <FullName first={props.first_name} last={props.last_name} url={props.url}/>,
    'Jurisdiction': <Jurisdiction jurisdiction={props.jurisdiction}/>,
    'ID': <FormattedID id={props.id}/>,
    'Sex': <Sex sex={props.sex}/>,
    'Unit': <Unit {...props.unit}/>,
    'Release': <Release release={props.release}/>,
  };

  return (
    <Table>
      <TableBody>
        {Object.keys(components).map((key, index) => (
        <TableRow key={index}>
          <TableCell component="th" scope="row">
            {key + ':'}
          </TableCell>
          <TableCell>
            {components[key]}
          </TableCell>
        </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DataTable(props) {
  const [data, setData] = useState(props.data);
  const [errors, setErrors] = useState({});

  class EditField extends MTableEditField {
    render() {
      const field = this.props.columnDef.field;
      return (
        <FormControl error={ field in errors }>
          {super.render()}
          <FormHelperText>{ (field in errors) ? errors[field] : '' }</FormHelperText>
        </FormControl>
      );
    }
  };

  async function onRowAdd(newData) {
    const url = props.url_base;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(newData),
      headers: {'Content-Type': 'application/json'}
    });

    const json = await response.json();

    if (!response.ok) {
      setErrors(json);
      throw new Error("Bad response from server.");
    }

    setData(prevState => {
      const newState = [...prevState];
      newState.unshift(json);
      return newState;
    });

    setErrors({});
  }

  async function onRowUpdate(newData, oldData) {
    const url = `${props.url_base}/${oldData.index}`;
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(newData),
      headers: {'Content-Type': 'application/json'}
    });

    const json = await response.json();

    if (!response.ok) {
      setErrors(json);
      throw new Error("Bad response from server.");
    }

    setData(prevState => {
      const data = [...prevState];
      data[data.indexOf(oldData)] = json;
      return data;
    });
  }

  async function onRowDelete(oldData) {
    const url = `${props.url_base}/${oldData.index}`;
    const response = await fetch(url, {
      headers: {'Content-Type': 'application/json'},
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error("Bad response from server.");
    }

    setData(prevState => {
      const newData = [...prevState];
      newData.splice(newData.indexOf(oldData), 1);
      return newData;
    });
  }

  return (
    <MaterialTable
      components={{EditField: EditField, Container: props.Container}}
      columns={props.columns}
      data={data}
      options={{
        search: false,
        showTitle: false,
        pageSize: 5,
        addRowPosition: 'first',
        pageSizeOptions: [],
        minBodyHeight: '400px',
        maxBodyHeight: '400px',
      }}
      localization={{header: {actions: ''}}}
      editable={{
        onRowAdd: onRowAdd,
        onRowUpdate: onRowUpdate,
        onRowDelete: onRowDelete,
      }}
    />
  );
}

export function RequestTable(props) {
  return (
    <DataTable
      columns={[
        {title: "Postmark Date", field: "date_postmarked", type: "date"},
        {title: "Action", field: "action", lookup: {Filled: "Filled", Tossed: "Tossed"}},
      ]}
      data={props.requests}
      Container={props.Container}
      url_base={`${props.url_base}/request/${props.jurisdiction}/${props.id}`}
    />
  );
}

export function CommentTable(props) {
  return (
    <DataTable
      columns={[
        {title: "Comment", field: "body"},
        {title: "Author", field: "author"},
        {title: "Date", field: "date", type: "date", editable: "never"},
      ]}
      data={props.comments}
      Container={props.Container}
      url_base={`${props.url_base}/comment/${props.jurisdiction}/${props.id}`}
    />
  );
};
