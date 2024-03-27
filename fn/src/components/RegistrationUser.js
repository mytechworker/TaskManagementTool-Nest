import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Grid, Paper } from '@material-ui/core';
import config from '../data/Config';
import Swal from 'sweetalert2';
import axios from 'axios';

const url = config.url + '/auth';

const RegistrationUser = () => {
  const navigate = useNavigate();

  const navigateToLoginPage = () => {
    navigate('/');
  };

  //handle data
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },

    //validation
    validationSchema: Yup.object({
      name: Yup.string().required('Enter Name'),
      email: Yup.string().email('Email is invalid').required('Enter Email'),
      password: Yup.string()
        .min(6, 'Password should be at least 6 characters')
        .required('Enter Password'),
    }),

    onSubmit: (values) => {
      console.log(values);
      axios
        .post(`${url}/signup`, values)
        .then((response) => {
          console.log('insert response', response);
          // use SweetAlert alert
          Swal.fire({
            icon: 'success',
            title: 'User created successfully',
            showConfirmButton: false,
            timer: 2000,
          }).then(navigateToLoginPage);
        })
        .catch((error) => {
          console.log(error);
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Email already exists!',
          });
        });
    },
  });

  const renderTextField = (name, label, type = 'text') => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label={label}
          name={name}
          type={type}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched[name] && formik.errors[name]}
          helperText={formik.touched[name] && formik.errors[name]}
          style={{ width: '325px' }}
        />
      </Grid>
    </Grid>
  );

  return (
    <div style={{ marginTop: '50px' }}>
      <form onSubmit={formik.handleSubmit}>
        <Paper
          elevation={20}
          style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}
        >
          <h3 align="center">Registration</h3>
          <Grid
            container
            spacing={2}
            direction="column"
            justify="center"
            alignItems="center"
          >
            {renderTextField('name', 'Enter Name')}
            {renderTextField('email', 'Enter Email', 'email')}
            {renderTextField('password', 'Enter Password', 'password')}
            <Grid item>
              <Button type="submit" variant="contained" color="primary">
                Register
              </Button>
            </Grid>
            <Grid item>
              Already have an account? <Link to="/">Login</Link>
            </Grid>
          </Grid>
        </Paper>
      </form>
    </div>
  );
};

export default RegistrationUser;
