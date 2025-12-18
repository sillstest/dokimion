import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import Pager from "../pager/Pager";
import * as Utils from "../common/Utils";
import Backend from "../services/backend";

const Users = ({ onProjectChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({
    skip: 0,
    limit: 20,
    orderby: "firstName",
    orderdir: "ASC",
    includedFields: "firstName,lastName,login,id,email,role",
  });
  const [pager, setPager] = useState({
    total: 0,
    current: 0,
    maxVisiblePage: 7,
    itemsOnPage: 20,
  });
  const [loading, setLoading] = useState(true);

  // Handle SubComponent's onProjectChange callback
  useEffect(() => {
    if (onProjectChange && params.project) {
      onProjectChange(params.project);
    }
  }, [onProjectChange, params.project]);

  // Initialize filter from URL on mount
  useEffect(() => {
    const queryParams = Utils.queryToFilter(location.search.substring(1));
    setFilter(prevFilter => ({ ...prevFilter, ...queryParams }));
  }, []); // Only run once on mount

  // Fetch users and pager when filter changes
  useEffect(() => {
    getUsers();
    getPager();
  }, [filter]);

  const getUsers = () => {
    Backend.get("user?" + Utils.filterToQuery(filter))
      .then(response => {
        setUsers(response);
        setLoading(false);
      })
      .catch(error => {
        console.log("Couldn't get users: " + error);
        setLoading(false);
      });
  };

  const getPager = () => {
    const countFilter = { ...filter, skip: 0, limit: 0 };
    Backend.get("user/count?" + Utils.filterToQuery(countFilter))
      .then(response => {
        setPager(prevPager => ({
          ...prevPager,
          total: response,
          current: filter.skip / filter.limit,
          visiblePage: Math.min(
            response / prevPager.itemsOnPage + 1,
            prevPager.maxVisiblePage
          ),
        }));
      })
      .catch(error => console.log(error));
  };

  const updateUrl = () => {
    navigate("/user?" + Utils.filterToQuery(filter));
  };

  const handlePageChanged = (newPage) => {
    const newFilter = {
      ...filter,
      skip: newPage * pager.itemsOnPage,
    };
    setFilter(newFilter);
    setPager(prevPager => ({ ...prevPager, current: newPage }));
    updateUrl();
  };

  return (
    <div>
      <div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">User</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <Link to={"/user/profile/" + user.login}>
                    {user.firstName} {user.lastName}{" "}
                    <span className="text-muted">@{user.login}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <Pager
            totalItems={pager.total}
            currentPage={pager.current}
            visiblePages={pager.maxVisiblePage}
            itemsOnPage={pager.itemsOnPage}
            onPageChanged={handlePageChanged}
          />
        </div>
      </div>
    </div>
  );
};

export default Users;
