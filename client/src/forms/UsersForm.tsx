import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import Visibility from '@material-ui/icons/Visibility';
import LockIcon from '@material-ui/icons/Lock';
import TokenIcon from '@material-ui/icons/VpnKey';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import ActionsMenu from '../components/ActionsMenu';
import { addNotification } from '../config/notifications';
import { DialogContext } from '../components/dialog/Dialog.context';
import IUser from '../interfaces/IUser';

export const UsersForm = () => {
  const { t, i18n } = useTranslation();

  const [users, setUsers] = useState<IUser[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const dialog = useContext(DialogContext);

  const stateToString = (state: string) =>
    t(
      'administration.users.states.' +
        (['ACTIVE', 'DEACTIVATED'].includes(state) ? state : 'UNKNOWN')
    );

  const tokenStateToString = (state: string) =>
    t(
      'administration.users.token.' +
        (['GENERATED', 'NOT_GENERATED'].includes(state) ? state : 'UNKNOWN')
    );

  const actions = useCallback(
    (r: IUser) => [
      // {
      //   icon: <Visibility color="primary" />,
      //   title: t('query.buttons.detail')
      //   // onClick: () => {
      //   //   dialog.open({
      //   //     size: 'lg',
      //   //     content: QueryDetailDialog,
      //   //     values: r
      //   //   });
      //   // }
      // },
      {
        icon: <LockIcon color="primary" />,
        title: t('administration.users.actions.changePassword')
      },
      {
        icon: <TokenIcon color={r.accessTokenGenerated ? 'secondary' : 'primary'} />,
        title: t(
          'administration.users.actions.' +
            (r.accessTokenGenerated ? 'deleteAccessToken' : 'generateAccessToken')
        ),
        onClick: () => {
          fetch('/api/user/' + r.id + '/token', {
            method: r.accessTokenGenerated ? 'DELETE' : 'POST'
          })
            .then((response) => {
              if (response.ok) {
                return response.text();
              }
              throw new Error();
            })
            .then((response) => {
              if (response) {
                alert(response);
              }
              refreshUsers();
            });
        }
      }
      // {
      //   icon: <DeleteForeverIcon color="secondary" />,
      //   title: t('query.buttons.repeat'),
      //   onClick: () => {
      //     fetch('/api/user/' + r.id, {
      //       method: 'DELETE'
      //     })
      //       .then((response) => {
      //         if (response.ok) {
      //           return response.text();
      //         }
      //         throw new Error();
      //       })
      //       .then(() => refreshUsers());
      //   }
      // }
    ],
    []
  );

  const refreshUsers = () => {
    fetch('/api/user')
      .then((res) => res.json())
      .then(
        (result) => {
          setUsers(result);
        },
        () => {
          setUsers([]);
        }
      );
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <>
      <Typography variant="h1">{t<string>('header.usersAdmin')}</Typography>
      <Card variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t<string>('administration.users.columns.email')}</TableCell>
                <TableCell>{t<string>('administration.users.columns.name')}</TableCell>
                <TableCell>{t<string>('administration.users.columns.role')}</TableCell>
                <TableCell>{t<string>('administration.users.columns.state')}</TableCell>
                <TableCell>{t<string>('administration.users.columns.accessToken')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{stateToString(row.enabled ? 'ACTIVE' : 'DEACTIVATED')}</TableCell>
                  <TableCell>
                    {tokenStateToString(row.accessTokenGenerated ? 'GENERATED' : 'NOT_GENERATED')}
                  </TableCell>
                  <TableCell>
                    <ActionsMenu actions={actions?.(row) ?? []} hideEmpty />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t<string>('pagination.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => {
            return '' + from + '-' + to + ' ' + t('pagination.from') + ' ' + count;
          }}
        />
      </Card>
    </>
  );
};