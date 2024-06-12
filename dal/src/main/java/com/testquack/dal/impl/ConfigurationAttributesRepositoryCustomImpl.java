package com.testquack.dal.impl;

import com.testquack.beans.ConfigurationAttributes;
import com.testquack.dal.ConfigurationAttributesRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.apache.commons.lang3.StringUtils.isEmpty;

import java.util.List;

public class ConfigurationAttributesRepositoryCustomImpl extends CommonRepositoryImpl<ConfigurationAttributes>
        implements ConfigurationAttributesRepositoryCustom {

    @Override
    public Class getEntityClass() {
        return ConfigurationAttributes.class;
    }

    @Override
    protected String getCollectionName(String organizationId, String projectId) {
        return isEmpty(organizationId) ? "ConfigurationAttributes" : organizationId + "_rolecapability";
    }

    @Override
    public List<ConfigurationAttributes> suggestConfigurationAttributes(String organizationId, String literal) {
        Criteria criteria = new Criteria();
        criteria.orOperator(
                Criteria.where("role").regex(literal, "i"),
                Criteria.where("capability").regex(literal, "i")
        );
        Query query = new Query(criteria);
        query.limit(20);
        return mongoOperations.find(query, ConfigurationAttributes.class, getCollectionName(organizationId, null));
    }

}
