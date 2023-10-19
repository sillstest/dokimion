package com.testquack.dal.impl;

import com.testquack.beans.RoleCapability;
import com.testquack.dal.RoleCapabilityRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.apache.commons.lang3.StringUtils.isEmpty;

import java.util.List;

public class RoleCapabilityRepositoryCustomImpl extends CommonRepositoryImpl<RoleCapability>
        implements RoleCapabilityRepositoryCustom {

    @Override
    public Class getEntityClass() {
        return RoleCapability.class;
    }

    @Override
    protected String getCollectionName(String organizationId, String projectId) {
        return isEmpty(organizationId) ? "RoleCapability" : organizationId + "_rolecapability";
    }

    @Override
    public List<RoleCapability> suggestRoleCapability(String organizationId, String literal) {
        Criteria criteria = new Criteria();
        criteria.orOperator(
                Criteria.where("role").regex(literal, "i"),
                Criteria.where("capability").regex(literal, "i")
        );
        Query query = new Query(criteria);
        query.limit(20);
        return mongoOperations.find(query, RoleCapability.class, getCollectionName(organizationId, null));
    }

}
