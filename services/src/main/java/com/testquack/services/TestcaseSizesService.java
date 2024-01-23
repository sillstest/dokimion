package com.testquack.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.testquack.beans.Filter;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.TestcaseSizesRepository;
import ru.greatbit.utils.string.StringUtils;
import ru.greatbit.whoru.auth.Session;

import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.lang.String.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Service
public class TestcaseSizesService extends BaseService<TestcaseSizes> {

    @Autowired
    private TestcaseSizesRepository repository;

    @Override
    protected CommonRepository<TestcaseSizes> getRepository() {
        return repository;
    }

    @Override
    public List<TestcaseSizes> findFiltered(Session session, String projectId, Filter filter) {
System.out.println("TestcaseSizesService.findFiltered - session: " + session);
System.out.println("TestcaseSizesService.findFiltered - projectId: " + projectId);
System.out.println("TestcaseSizesService.findFiltered - filter: " + filter);
System.out.flush();
        List<TestcaseSizes> listTCSizes = getRepository().find(getCurrOrganizationId(session), projectId, filter);
        for (TestcaseSizes tcSize : listTCSizes) {
           System.out.println("TestcaseSizesService::findFiltered - tcSize: " + tcSize);
           System.out.flush();
        }
        return listTCSizes;

        //return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }


    public List<TestcaseSizes> findAll() {

System.out.println("TestcaseSizesService::findAll");
System.out.flush();

        List<TestcaseSizes> tcSizesList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (TestcaseSizes tcSize : tcSizesList) {
           System.out.println("TestcaseSizesService.findAll() - tcSize: " + tcSize);
           System.out.flush();
        }


        return tcSizesList;
        //return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }



}
