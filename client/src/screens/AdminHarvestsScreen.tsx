import React from 'react';
import {useTranslation} from "react-i18next";
import {Header} from "../components/Header";
import {Link} from "react-router-dom";
import {UserMenu} from "../components/UserMenu";
import {AdminHarvestsForm} from "../forms/AdminHarvestsForm";
import {Container} from "@material-ui/core";

export const AdminHarvestsScreen = () => {
  const { t } = useTranslation();

  return (
    <Header toolbar={
      <>
        <Link to="/admin" style={{color: '#0000ff'}}>{t('administration.harvests.menu')}</Link>
        <UserMenu />
      </>
    }>
      <Container>
        <AdminHarvestsForm/>
      </Container>
    </Header>
  );
};

