import React, { useState, useEffect, useCallback } from "react";
import { withRouter } from "../common/withRouter";
import Pager from "../pager/Pager";
import { Link } from "react-router-dom";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";

const ITEMS_ON_PAGE = 20;
const MAX_VISIBLE_PAGES = 7;
const defaultFilter = {
  skip: 0,
  limit: ITEMS_ON_PAGE,
  orderby: "firstName",
  orderdir: "ASC",
  includedFields: "firstName,lastName,login,id,email,role",
};

function Users({ location, history }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState(() => ({
    ...defaultFilter,
    ...Utils.queryToFilter(location.search.substring(1)),
  }));
  const [pagerTotal, setPagerTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchUsers = useCallback(f => {
    Backend.get("user?" + Utils.filterToQuery(f))
      .then(response => setUsers(response))
      .catch(error => console.log("Couldn't get users: " + error));
  }, []);

  const fetchCount = useCallback(f => {
    const countFilter = { ...f, skip: 0, limit: 0 };
    Backend.get("user/count?" + Utils.filterToQuery(countFilter))
      .then(response => setPagerTotal(response))
      .catch(error => console.log(error));
  }, []);

  useEffect(() => {
    fetchUsers(filter);
    fetchCount(filter);
  }, []);

  function handlePageChanged(newPage) {
    const updated = { ...filter, skip: newPage * ITEMS_ON_PAGE };
    setFilter(updated);
    setCurrentPage(newPage);
    fetchUsers(updated);
    history.push("/user?" + Utils.filterToQuery(updated));
  }

  return (
    <div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th scope="col">User</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={i}>
              <td>
                <Link to={"/user/profile/" + user.login}>
                  {user.firstName} {user.lastName} <span className="text-muted">@{user.login}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager
        totalItems={pagerTotal}
        currentPage={currentPage}
        visiblePages={MAX_VISIBLE_PAGES}
        itemsOnPage={ITEMS_ON_PAGE}
        onPageChanged={handlePageChanged}
      />
    </div>
  );
}

export default withRouter(Users);
